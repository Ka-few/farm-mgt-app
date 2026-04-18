import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const WorkersReport: React.FC = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [laborLogs, setLaborLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [wData, lData] = await Promise.all([
                invoke<any[]>('get_workers'),
                invoke<any[]>('get_labor_logs')
            ]);
            setWorkers(wData);
            setLaborLogs(lData);
        } catch (error) {
            console.error('Failed to load workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeWorkers = workers.filter(w => w.is_active === 1 || w.is_active === true);
    const averageWage = workers.length > 0
        ? workers.reduce((sum, w) => sum + (w.daily_rate || 0), 0) / workers.length : 0;
    const totalLaborCost = laborLogs.reduce((sum, l) => sum + (l.amount || 0), 0);

    // Role pie
    const roleMap: Record<string, number> = {};
    workers.forEach(w => { const r = w.role || 'Unspecified'; roleMap[r] = (roleMap[r] || 0) + 1; });
    const rolePieData = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    // Daily rate bar chart
    const wageBarData = workers.map(w => ({ name: w.name, rate: w.daily_rate || 0 })).sort((a, b) => b.rate - a.rate).slice(0, 10);

    // Labor log cost by worker bar chart
    const workerCostMap: Record<string, number> = {};
    laborLogs.forEach(l => { const n = l.worker_name || 'Unknown'; workerCostMap[n] = (workerCostMap[n] || 0) + (l.amount || 0); });
    const workerCostBarData = Object.entries(workerCostMap).map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) })).sort((a, b) => b.cost - a.cost).slice(0, 8);

    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('JOMUKU FARM – Workers & Labor Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 28);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(12);
        doc.text(`Active Workers:   ${activeWorkers.length} / ${workers.length}`, 14, 40);
        doc.text(`Avg Daily Rate:   KShs ${averageWage.toFixed(2)}`, 14, 48);
        doc.text(`Total Labor Cost: KShs ${totalLaborCost.toFixed(2)}`, 14, 56);

        autoTable(doc, {
            startY: 64,
            head: [['Name', 'Role', 'Status', 'Daily Rate (KShs)']],
            body: workers.map(w => [w.name, w.role || '-', (w.is_active === 1 || w.is_active) ? 'Active' : 'Inactive', (w.daily_rate || 0).toFixed(2)]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('workers-report.pdf');
    };

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Workers & Labor Report</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Active Workers', value: `${activeWorkers.length} / ${workers.length}`, color: '#10b981' },
                    { label: 'Avg Daily Rate', value: `KShs ${averageWage.toFixed(2)}`, color: 'var(--text-primary)' },
                    { label: 'Total Labor Cost', value: `KShs ${totalLaborCost.toFixed(2)}`, color: '#ef4444' }
                ].map(c => (
                    <div key={c.label} className="stat-card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{c.label}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Role Pie */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Staff by Role</h3>
                            {rolePieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No workers yet.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={rolePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                            {rolePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Daily Wage Bar */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Daily Rate by Worker</h3>
                            {wageBarData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={wageBarData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={80} />
                                        <Tooltip formatter={(v: any) => `KShs ${v}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                        <Bar dataKey="rate" name="Daily Rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Labor cost bar */}
                    {workerCostBarData.length > 0 && (
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Total Labor Cost by Worker</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={workerCostBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <Tooltip formatter={(v: any) => `KShs ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Bar dataKey="cost" name="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Staff Table */}
                    <div className="table-container">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0 }}>Staff Members</h3>
                        </div>
                        <table>
                            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Daily Rate</th></tr></thead>
                            <tbody>
                                {workers.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No workers found.</td></tr>
                                ) : workers.map(w => (
                                    <tr key={w.id}>
                                        <td style={{ fontWeight: 600 }}>{w.name}</td>
                                        <td>{w.role || '-'}</td>
                                        <td><span className={`badge ${(w.is_active === 1 || w.is_active) ? 'badge-success' : 'badge-warning'}`}>{(w.is_active === 1 || w.is_active) ? 'Active' : 'Inactive'}</span></td>
                                        <td>KShs {(w.daily_rate || 0).toFixed(2)}</td>
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

export default WorkersReport;
