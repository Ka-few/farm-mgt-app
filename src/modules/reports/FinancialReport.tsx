import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const FinancialReport: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_finance_records');
            setRecords(data);
        } catch (error) {
            console.error('Failed to load financial records:', error);
        } finally {
            setLoading(false);
        }
    };

    const income = records.filter(r => r.record_type === 'income').reduce((s, r) => s + r.amount, 0);
    const expenses = records.filter(r => r.record_type === 'expense').reduce((s, r) => s + r.amount, 0);
    const balance = income - expenses;

    // ---- Chart Data ----
    // Monthly bar chart
    const monthlyMap: Record<string, { income: number; expenses: number }> = {};
    records.forEach(r => {
        const month = new Date(r.date).toLocaleDateString('en-KE', { year: '2-digit', month: 'short' });
        if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 };
        if (r.record_type === 'income') monthlyMap[month].income += r.amount;
        else monthlyMap[month].expenses += r.amount;
    });
    const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v })).slice(-8);

    // Pie chart by category
    const categoryMap: Record<string, number> = {};
    records.filter(r => r.record_type === 'expense').forEach(r => {
        categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // Line chart — cumulative balance
    let cumulative = 0;
    const lineData = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => {
        cumulative += r.record_type === 'income' ? r.amount : -r.amount;
        return { date: r.date.substring(0, 10), balance: parseFloat(cumulative.toFixed(2)) };
    }).slice(-30);

    // ---- PDF Export ----
    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('ShambaSmart FARM – Financial Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 28);
        doc.setLineWidth(0.3);
        doc.line(14, 30, 196, 30);

        // Summary
        doc.setFontSize(12);
        doc.text(`Total Income:   Kshs ${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 40);
        doc.text(`Total Expenses: Kshs ${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 48);
        doc.setTextColor(balance >= 0 ? '#10b981' : '#ef4444');
        doc.text(`Net Balance:    Kshs ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 56);
        doc.setTextColor('#000000');

        autoTable(doc, {
            startY: 64,
            head: [['Date', 'Category', 'Description', 'Type', 'Amount (Kshs)']],
            body: records.map(r => [
                new Date(r.date).toLocaleDateString('en-KE'),
                r.category,
                r.description || '-',
                r.record_type.toUpperCase(),
                r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('financial-report.pdf');
    };

    return (
        <div className="report-container" ref={reportRef}>
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Financial Report</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Income', value: `Kshs ${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#10b981' },
                    { label: 'Total Expenses', value: `Kshs ${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#ef4444' },
                    { label: 'Net Balance', value: `Kshs ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: balance >= 0 ? '#10b981' : '#ef4444' }
                ].map(c => (
                    <div key={c.label} className="stat-card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{c.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p> : (
                <>
                    {/* Bar Chart */}
                    <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Monthly Income vs Expenses</h3>
                        {monthlyData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data yet.</p> : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                    <Tooltip formatter={(v: any) => `Kshs ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Pie Chart */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Expense Breakdown</h3>
                            {pieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No expenses yet.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `Kshs ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Line Chart */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Cumulative Balance Trend</h3>
                            {lineData.length < 2 ? <p style={{ color: 'var(--text-secondary)' }}>Not enough data for trend.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={lineData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                        <Tooltip formatter={(v: any) => `Kshs ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="table-container">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0 }}>All Transactions</h3>
                        </div>
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Category</th><th>Description</th><th>Type</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No records.</td></tr>
                                ) : records.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.date).toLocaleDateString()}</td>
                                        <td>{r.category}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.description || '-'}</td>
                                        <td><span className={`badge ${r.record_type === 'income' ? 'badge-success' : 'badge-warning'}`}>{r.record_type}</span></td>
                                        <td style={{ fontWeight: 700, color: r.record_type === 'income' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                            {r.record_type === 'income' ? '+' : '-'}Kshs {r.amount.toFixed(2)}
                                        </td>
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

export default FinancialReport;
