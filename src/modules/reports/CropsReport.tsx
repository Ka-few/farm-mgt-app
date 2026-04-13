import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Download } from 'lucide-react';

const CropsReport: React.FC = () => {
    const [crops, setCrops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data: any[] = await invoke('get_crops');
            setCrops(data);
        } catch (error) {
            console.error("Failed to load crops:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeCrops = crops.filter(c => c.phase !== 'Harvested');
    const harvestedCrops = crops.filter(c => c.phase === 'Harvested');

    const groupedByPhase: Record<string, number> = {};
    crops.forEach(c => {
        const p = c.phase || 'Unknown';
        groupedByPhase[p] = (groupedByPhase[p] || 0) + 1;
    });

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Crop Status Report</h2>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Active Plantings</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color, #10b981)' }}>
                        {activeCrops.length}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Completed/Harvested</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {harvestedCrops.length}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginTop: 0 }}>Total Records</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {crops.length}
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Crop Details</h3>
                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading crop data...</p>
                ) : crops.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No crops found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '0.75rem 0' }}>Plot</th>
                                    <th style={{ padding: '0.75rem 0' }}>Crop / Variety</th>
                                    <th style={{ padding: '0.75rem 0' }}>Phase</th>
                                    <th style={{ padding: '0.75rem 0' }}>Planting Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crops.map(crop => (
                                    <tr key={crop.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{crop.plot_name || 'Unassigned'}</td>
                                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {crop.name} <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>({crop.variety})</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: crop.phase === 'Harvested' ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.1)',
                                                color: crop.phase === 'Harvested' ? 'var(--text-secondary)' : 'var(--success-color, #10b981)'
                                            }}>
                                                {crop.phase}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>
                                            {new Date(crop.planting_date).toLocaleDateString()}
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

export default CropsReport;
