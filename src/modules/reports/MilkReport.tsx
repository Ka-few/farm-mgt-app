import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download } from 'lucide-react';

const MilkReport: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_production_logs', { prodType: 'milk' });
            setLogs(data);
        } catch (error) {
            console.error("Failed to load milk records:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalMilk = logs.reduce((sum, log) => sum + log.quantity, 0);
    // Group by animal Tag
    const groupedByTag: Record<string, { name: string, quantity: number, count: number }> = {};
    logs.forEach(log => {
        const tag = log.livestock_tag || 'Unknown';
        if (!groupedByTag[tag]) {
            groupedByTag[tag] = { name: log.livestock_name || 'N/A', quantity: 0, count: 0 };
        }
        groupedByTag[tag].quantity += log.quantity;
        groupedByTag[tag].count += 1;
    });

    const animalStats = Object.entries(groupedByTag).sort((a, b) => b[1].quantity - a[1].quantity);

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Milk Production Report</h2>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Production</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {totalMilk.toFixed(1)} Liters
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Entries Count</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {logs.length}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Top Producer</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {animalStats.length > 0 ? `${animalStats[0][0]} (${(animalStats[0][1].quantity).toFixed(1)}L)` : 'N/A'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Production by Animal</h3>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Loading data...</p>
                    ) : animalStats.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No milk records found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.75rem 0' }}>Tag</th>
                                        <th style={{ padding: '0.75rem 0' }}>Name</th>
                                        <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Total (Liters)</th>
                                        <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Records</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {animalStats.map(([tag, stats]) => (
                                        <tr key={tag} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{tag}</td>
                                            <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{stats.name}</td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {stats.quantity.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                {stats.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Recent Logs</h3>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Loading data...</p>
                    ) : logs.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No logs found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.75rem 0' }}>Date</th>
                                        <th style={{ padding: '0.75rem 0' }}>Tag</th>
                                        <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.slice(0, 10).map((log, i) => (
                                        <tr key={log.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{new Date(log.recorded_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{log.livestock_tag || '-'}</td>
                                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {log.quantity.toFixed(1)} L
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

export default MilkReport;
