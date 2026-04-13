import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const MilkReport: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_production_logs', { prodType: 'milk' });
            setLogs(data);
        } catch (error) {
            console.error('Failed to load milk records:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalMilk = logs.reduce((sum, log) => sum + log.quantity, 0);

    // Group by animal tag for pie
    const groupedByTag: Record<string, { name: string; quantity: number; count: number }> = {};
    logs.forEach(log => {
        const tag = log.livestock_tag || 'Unknown';
        if (!groupedByTag[tag]) groupedByTag[tag] = { name: log.livestock_name || 'N/A', quantity: 0, count: 0 };
        groupedByTag[tag].quantity += log.quantity;
        groupedByTag[tag].count += 1;
    });
    const animalStats = Object.entries(groupedByTag).sort((a, b) => b[1].quantity - a[1].quantity);
    const pieData = animalStats.map(([tag, s]) => ({ name: tag, value: parseFloat(s.quantity.toFixed(1)) }));

    // Daily line chart
    const dailyMap: Record<string, number> = {};
    logs.forEach(log => {
        const day = (log.recorded_at || '').substring(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + log.quantity;
    });
    const lineData = Object.entries(dailyMap).sort().map(([date, qty]) => ({ date, qty: parseFloat(qty.toFixed(1)) })).slice(-20);

    // Bar chart by animal
    const barData = animalStats.map(([tag, s]) => ({ tag, liters: parseFloat(s.quantity.toFixed(1)) })).slice(0, 8);

    // PDF export
    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('JOMUKU FARM – Milk Production Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 28);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(12);
        doc.text(`Total Production: ${totalMilk.toFixed(1)} Litres`, 14, 40);
        doc.text(`Total Sessions:   ${logs.length}`, 14, 48);

        autoTable(doc, {
            startY: 56,
            head: [['Date', 'Tag', 'Name', 'Quantity (L)']],
            body: logs.map(l => [
                new Date(l.recorded_at).toLocaleDateString('en-KE'),
                l.livestock_tag || '-',
                l.livestock_name || '-',
                l.quantity.toFixed(1)
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
        });
        doc.save('milk-report.pdf');
    };

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Milk Production Report</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card glass" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Yield</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{totalMilk.toFixed(1)} L</div>
                </div>
                <div className="stat-card glass" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Log Sessions</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{logs.length}</div>
                </div>
                <div className="stat-card glass" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Top Producer</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {animalStats.length > 0 ? `${animalStats[0][0]} (${animalStats[0][1].quantity.toFixed(1)}L)` : 'N/A'}
                    </div>
                </div>
            </div>

            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p> : (
                <>
                    {/* Daily Line Chart */}
                    <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Daily Milk Yield Trend</h3>
                        {lineData.length < 2 ? <p style={{ color: 'var(--text-secondary)' }}>Not enough data for trend.</p> : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <Tooltip formatter={(v: number) => `${v} L`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Line type="monotone" dataKey="qty" name="Liters" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Bar Chart */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Yield by Animal</h3>
                            {barData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data.</p> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={barData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <YAxis dataKey="tag" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={60} />
                                        <Tooltip formatter={(v: number) => `${v} L`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                        <Bar dataKey="liters" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Pie Chart */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Share by Animal</h3>
                            {pieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data.</p> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => `${v} L`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MilkReport;
