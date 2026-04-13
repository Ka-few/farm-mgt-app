import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

const CropsReport: React.FC = () => {
    const [crops, setCrops] = useState<any[]>([]);
    const [harvests, setHarvests] = useState<any[]>([]);
    const [weedings, setWeedings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cropData, harvestData, weedData] = await Promise.all([
                invoke<any[]>('get_crops'),
                invoke<any[]>('get_harvest_records', { cropId: null }),
                invoke<any[]>('get_weeding_records', { cropId: null }),
            ]);
            setCrops(cropData);
            setHarvests(harvestData);
            setWeedings(weedData);
        } catch (error) {
            console.error('Failed to load crop data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Phase breakdown pie
    const phaseMap: Record<string, number> = {};
    crops.forEach(c => { const p = c.phase || 'Unknown'; phaseMap[p] = (phaseMap[p] || 0) + 1; });
    const pieData = Object.entries(phaseMap).map(([name, value]) => ({ name, value }));

    // Harvest quantity by crop bar chart
    const harvestByCrop: Record<string, number> = {};
    harvests.forEach(h => { harvestByCrop[h.crop_name || 'Unknown'] = (harvestByCrop[h.crop_name || 'Unknown'] || 0) + h.quantity; });
    const harvestBarData = Object.entries(harvestByCrop).map(([crop, qty]) => ({ crop, qty: parseFloat(qty.toFixed(1)) })).sort((a, b) => b.qty - a.qty).slice(0, 8);

    // Weeding mode breakdown
    const weedModeMap: Record<string, number> = {};
    weedings.forEach(w => { weedModeMap[w.mode] = (weedModeMap[w.mode] || 0) + 1; });
    const weedPieData = Object.entries(weedModeMap).map(([name, value]) => ({ name, value }));

    const exportPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('JOMUKU FARM – Crop Status Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 14, 28);
        doc.line(14, 30, 196, 30);

        doc.setFontSize(12);
        doc.text(`Total Crops Registered: ${crops.length}`, 14, 40);
        doc.text(`Total Harvest Sessions: ${harvests.length}`, 14, 48);
        doc.text(`Total Weeding Sessions: ${weedings.length}`, 14, 56);

        autoTable(doc, {
            startY: 64,
            head: [['Crop', 'Variety', 'Location', 'Phase', 'Planting Date']],
            body: crops.map(c => [c.name, c.variety || '-', c.plot_name || '-', c.phase || '-', new Date(c.planting_date).toLocaleDateString('en-KE')]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [16, 185, 129] }
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Crop', 'Quantity', 'Unit', 'Harvest Date', 'Cost']],
            body: harvests.map(h => [h.crop_name || '-', h.quantity, h.unit, new Date(h.harvest_date).toLocaleDateString('en-KE'), `KShs ${h.cost.toFixed(2)}`]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('crops-report.pdf');
    };

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Crop Status Report</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Crops', value: crops.length },
                    { label: 'Harvest Sessions', value: harvests.length },
                    { label: 'Weeding Sessions', value: weedings.length }
                ].map(c => (
                    <div key={c.label} className="stat-card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{c.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading charts...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Phase Pie */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Crops by Growth Phase</h3>
                            {pieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Weeding Pie */}
                        <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Weeding Mode Breakdown</h3>
                            {weedPieData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No weeding records.</p> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={weedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                            {weedPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Harvest Bar Chart */}
                    <div className="card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Total Harvest by Crop</h3>
                        {harvestBarData.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No harvest records yet.</p> : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={harvestBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="crop" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Bar dataKey="qty" name="Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Crops Table */}
                    <div className="table-container">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0 }}>All Crops</h3>
                        </div>
                        <table>
                            <thead><tr><th>Crop</th><th>Variety</th><th>Location</th><th>Phase</th><th>Planting Date</th></tr></thead>
                            <tbody>
                                {crops.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No crops registered.</td></tr>
                                ) : crops.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                                        <td>{c.variety || '-'}</td>
                                        <td>{c.plot_name || '-'}</td>
                                        <td><span className="badge badge-info">{c.phase}</span></td>
                                        <td>{new Date(c.planting_date).toLocaleDateString()}</td>
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

export default CropsReport;
