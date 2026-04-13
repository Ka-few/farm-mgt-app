import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download } from 'lucide-react';

const WorkersReport: React.FC = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_workers');
            setWorkers(data);
        } catch (error) {
            console.error("Failed to load workers:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeWorkers = workers.filter(w => w.is_active === 1 || w.is_active === true);

    // Group by roles
    const groupedByRole: Record<string, number> = {};
    workers.forEach(w => {
        const r = w.role || 'Unspecified';
        groupedByRole[r] = (groupedByRole[r] || 0) + 1;
    });

    const averageWage = workers.length > 0
        ? workers.reduce((sum, w) => sum + (w.daily_rate || 0), 0) / workers.length
        : 0;

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Workers & Labor Report</h2>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Active Workforce</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color, #10b981)' }}>
                        {activeWorkers.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ {workers.length} Total</span>
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Average Daily Rate</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Ksh {averageWage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Role Distribution</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {Object.entries(groupedByRole).map(([role, count]) => (
                            <li key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{role}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Staff Details</h3>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Loading worker data...</p>
                    ) : workers.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No workers found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.75rem 0' }}>Name</th>
                                        <th style={{ padding: '0.75rem 0' }}>Role</th>
                                        <th style={{ padding: '0.75rem 0' }}>Status</th>
                                        <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Daily Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map(worker => (
                                        <tr key={worker.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{worker.name}</td>
                                            <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{worker.role}</td>
                                            <td style={{ padding: '0.75rem 0' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: (worker.is_active === 1 || worker.is_active === true) ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                                    color: (worker.is_active === 1 || worker.is_active === true) ? 'var(--success-color, #10b981)' : 'var(--text-secondary)'
                                                }}>
                                                    {(worker.is_active === 1 || worker.is_active === true) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                Ksh {worker.daily_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkersReport;
