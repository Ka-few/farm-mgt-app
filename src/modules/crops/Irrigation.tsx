import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Clock, Zap } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

interface Plot {
    id: string;
    name: string;
}

interface IrrigationRecord {
    id: string;
    plot_id: string;
    plot_name: string;
    method: string;
    source: string;
    duration_minutes: number;
    water_used_litres: number;
    date: string;
    cost: number;
}

const Irrigation: React.FC = () => {
    const [records, setRecords] = useState<IrrigationRecord[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [plotId, setPlotId] = useState('');
    const [method, setMethod] = useState('drip');
    const [source, setSource] = useState('borehole');
    const [duration, setDuration] = useState('');
    const [water, setWater] = useState('');
    const [cost, setCost] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            const recordsResult = await invoke<IrrigationRecord[]>('get_irrigation_records');
            setRecords(recordsResult);

            const plotsResult = await invoke<Plot[]>('get_plots');
            setPlots(plotsResult);
        } catch (err) {
            console.error('Error loading irrigation data:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plotId || !date) return;

        setLoading(true);
        try {
            const amount = parseFloat(cost) || 0;

            await invoke('record_irrigation', {
                plotId,
                method,
                source,
                duration: parseInt(duration) || 0,
                waterUsed: parseFloat(water) || 0.0,
                date,
                cost: amount
            });

            setShowAdd(false);
            setDuration('');
            setWater('');
            setCost('');
            loadData();
            alert('Irrigation record saved!');
        } catch (err) {
            console.error(err);
            alert('Error saving record');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this irrigation record?')) return;
        try {
            await invoke('delete_irrigation_record', { id });
            loadData();
            alert('Record deleted successfully');
        } catch (err) {
            console.error(err);
            alert('Error deleting record');
        }
    };

    return (
        <div className="irrigation-page">
            <div className="welcome-header">
                <div>
                    <h2>Irrigation Management</h2>
                    <p className="subtitle">Monitor water usage and irrigation schedules.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(!showAdd)}>
                    <Plus size={18} />
                    <span>{showAdd ? 'Cancel' : 'Log Irrigation'}</span>
                </button>
            </div>

            {showAdd && (
                <div className="form-container glass" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <h3>Irrigation Event</h3>
                    <form onSubmit={handleAddRecord} className="entry-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Plot / Area</label>
                            <select value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
                                <option value="">Select Location...</option>
                                {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Method</label>
                            <select value={method} onChange={(e) => setMethod(e.target.value)}>
                                <option value="drip">Drip</option>
                                <option value="sprinkler">Sprinkler</option>
                                <option value="flood">Flood</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Water Source</label>
                            <select value={source} onChange={(e) => setSource(e.target.value)}>
                                <option value="borehole">Borehole</option>
                                <option value="river">River / Stream</option>
                                <option value="rain">Rainwater Tank</option>
                                <option value="utility">Municipal / Utility</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Duration (Minutes)</label>
                            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="0" />
                        </div>
                        <div className="input-group">
                            <label>Water Used (Litres)</label>
                            <input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="0.0" />
                        </div>
                        <div className="input-group">
                            <label>Estimated Cost (Power/Water)</label>
                            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="input-group">
                            <label>Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="button-primary" disabled={loading}>
                                <Save size={18} />
                                <span>Save Record</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Method</th>
                            <th>Source</th>
                            <th>Duration</th>
                            <th>Volume</th>
                            <th>Date</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No irrigation records found.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id}>
                                    <td style={{ fontWeight: 600 }}>{record.plot_name || 'N/A'}</td>
                                    <td><span className="badge badge-info">{record.method}</span></td>
                                    <td>{record.source}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Clock size={14} className="icon-secondary" />
                                            {record.duration_minutes} min
                                        </div>
                                    </td>
                                    <td>{record.water_used_litres} L</td>
                                    <td>{record.date}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Zap size={14} style={{ color: 'var(--accent-warning)' }} />
                                            KShs {record.cost.toFixed(2)}
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn-icon danger" onClick={() => handleDeleteRecord(record.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Irrigation;
