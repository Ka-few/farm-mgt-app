import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

const HealthReport: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_health_records');
            setRecords(data);
        } catch (error) {
            console.error('Failed to load health records:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Type breakdown pie
    const typeMap: Record<string, number> = {};
    records.forEach(r => { const t = r.record_type || 'Unknown'; typeMap[t] = (typeMap[t] || 0) + 1; });
    const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Cost by animal bar
    const animalCostMap: Record<string, number> = {};
    records.forEach(r => {
        const key = `${r.livestock_tag || '?'} (${r.livestock_name || ''})`;
        animalCostMap[key] = (animalCostMap[key] || 0) + (r.cost || 0);
    });
    const costBarData = Object.entries(animalCostMap).map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) })).sort((a, b) => b.cost - a.cost).slice(0, 8);

    // Monthly cost trend
    const monthCostMap: Record<string, number> = {};
    records.forEach(r => {
        const month = new Date(r.record_date).toLocaleDateString('en-KE', { year: '2-digit', month: 'short' });
        monthCostMap[month] = (monthCostMap[month] || 0) + (r.cost || 0);
    });
    const lineData = Object.entries(monthCostMap).map(([month, cost]) => ({ month, cost: parseFloat(cost.toFixed(2)) })).slice(-8);

    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('ShambaSmart FARM – Livestock Health Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 28);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(12);
        doc.text(`Total Records:     ${records.length}`, 14, 40);
        doc.text(`Total Vet Costs:   Kshs ${totalCost.toFixed(2)}`, 14, 48);

        autoTable(doc, {
            startY: 56,
            head: [['Date', 'Animal', 'Type', 'Description', 'Next Visit', 'Cost (Kshs)']],
            body: records.map(r => [
                new Date(r.record_date).toLocaleDateString('en-KE'),
                `${r.livestock_tag || '?'} ${r.livestock_name || ''}`,
                r.record_type || '-',
                r.description || '-',
                r.next_visit ? new Date(r.next_visit).toLocaleDateString('en-KE') : '-',
                (r.cost || 0).toFixed(2)
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [245, 158, 11] }
        });

        doc.save('health-report.pdf');
    };

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Livestock Health Report</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Cases', value: records.length },
                    { label: 'Vet Costs', value: `Kshs ${totalCost.toFixed(2)}`, color: '#ef4444' },
                    { label: 'Most Common', value: pieData.length > 0 ? pieData[0].name : 'N/A', color: '#f59e0b' }
                ].map(c => (
                    <div key={c.label} className="stat-card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{c.label}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: c.color || 'var(--text-primary)' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Type Pie */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Cases by Type</h3>
                            {pieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Monthly Cost Line */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Monthly Vet Cost Trend</h3>
                            {lineData.length < 2 ? <p style={{ color: 'var(--text-secondary)' }}>Not enough data.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <Tooltip formatter={(v: any) => `Kshs ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Vet Cost by Animal Bar */}
                    {costBarData.length > 0 && (
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Vet Cost by Animal</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={costBarData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} width={120} />
                                    <Tooltip formatter={(v: any) => `Kshs ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Health Logs Table */}
                    <div className="table-container">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0 }}>Health Records</h3>
                        </div>
                        <table>
                            <thead><tr><th>Date</th><th>Animal</th><th>Type</th><th>Description</th><th>Next Visit</th><th>Cost</th></tr></thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No health records.</td></tr>
                                ) : records.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.record_date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{r.livestock_tag} — {r.livestock_name}</td>
                                        <td><span className="badge badge-warning">{r.record_type}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.description || '-'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.next_visit ? new Date(r.next_visit).toLocaleDateString() : '-'}</td>
                                        <td>{r.cost > 0 ? `Kshs ${r.cost.toFixed(2)}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default HealthReport;
