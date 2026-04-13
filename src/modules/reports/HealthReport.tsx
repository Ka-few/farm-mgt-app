import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download } from 'lucide-react';

const HealthReport: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_health_records');
            setRecords(data);
        } catch (error) {
            console.error("Failed to load health records:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    const groupedByType: Record<string, number> = {};
    records.forEach(r => {
        const t = r.record_type || 'Unknown';
        groupedByType[t] = (groupedByType[t] || 0) + 1;
    });

    const casesStats = Object.entries(groupedByType).sort((a, b) => b[1] - a[1]);

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Livestock Health Report</h2>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Medical Costs</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error-color, #ef4444)' }}>
                        Ksh {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Records</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {records.length} Cases
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Most Common Issue</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color, #f59e0b)' }}>
                        {casesStats.length > 0 ? casesStats[0][0] : 'N/A'}
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Health Logs</h3>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading health data...</p>
                ) : records.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No health records found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 0' }}>Date</th>
                                    <th style={{ padding: '0.75rem 0' }}>Animal</th>
                                    <th style={{ padding: '0.75rem 0' }}>Record Type</th>
                                    <th style={{ padding: '0.75rem 0' }}>Description</th>
                                    <th style={{ padding: '0.75rem 0' }}>Next Visit</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{new Date(record.record_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {record.livestock_tag || 'Unknown'} - <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{record.livestock_name}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)' }}>{record.record_type}</td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{record.description}</td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>
                                            {record.next_visit ? new Date(record.next_visit).toLocaleDateString() : 'None'}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {record.cost > 0 ? `Ksh ${record.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
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

export default HealthReport;
