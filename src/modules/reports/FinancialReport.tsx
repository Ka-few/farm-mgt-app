import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FinanceRecord } from '../../models'; // Assuming models are available, otherwise will fallback to any
import { Download } from 'lucide-react';

const FinancialReport: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_finance_records');
            setRecords(data);
        } catch (error) {
            console.error("Failed to load financial records:", error);
        } finally {
            setLoading(false);
        }
    };

    const income = records.filter(r => r.record_type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expenses = records.filter(r => r.record_type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const balance = income - expenses;

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Financial Report</h2>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Income</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color, #10b981)' }}>
                        Ksh {income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Expenses</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error-color, #ef4444)' }}>
                        Ksh {expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Net Balance</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: balance >= 0 ? 'var(--text-primary)' : 'var(--error-color, #ef4444)' }}>
                        Ksh {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Recent Transactions</h3>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading financial data...</p>
                ) : records.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No financial records found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 0' }}>Date</th>
                                    <th style={{ padding: '0.75rem 0' }}>Description</th>
                                    <th style={{ padding: '0.75rem 0' }}>Category</th>
                                    <th style={{ padding: '0.75rem 0' }}>Type</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{new Date(record.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{record.description}</td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{record.category}</td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: record.record_type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: record.record_type === 'income' ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)'
                                            }}>
                                                {record.record_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            Ksh {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialReport;
