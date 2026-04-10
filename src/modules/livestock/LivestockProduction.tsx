import React, { useState, useEffect } from 'react';
import { Droplets, Utensils, Calendar, Plus, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface ProductionLog {
    id: string;
    livestock_id: string;
    production_type: string;
    quantity: number;
    unit: string;
    recorded_at: string;
}

const LivestockProduction: React.FC = () => {
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [animalId, setAnimalId] = useState('');
    const [prodType, setProdType] = useState('milk');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('L');

    const loadLogs = async () => {
        try {
            const result = await invoke<ProductionLog[]>('get_production_logs');
            setLogs(result);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('record_production', {
                livestockId: animalId || null,
                productionType: prodType,
                quantity: parseFloat(quantity),
                unit,
                recordedAt: new Date().toISOString()
            });
            setShowAdd(false);
            setAnimalId('');
            setQuantity('');
            loadLogs();
        } catch (err) {
            console.error(err);
            alert('Error recording production');
        }
    };

    return (
        <div className="livestock-production">
            <div className="welcome-header">
                <div>
                    <h3>Yield & Production</h3>
                    <p className="subtitle">Track milk output and meat/beef production.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={18} /> Record Production
                </button>
            </div>

            {showAdd && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '450px' }}>
                        <h3>Record Production</h3>
                        <form onSubmit={handleSubmit} className="entry-form">
                            <div className="input-group">
                                <label>Animal Tag (Optional)</label>
                                <input value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="e.g. COW-001" />
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Production Type</label>
                                    <select value={prodType} onChange={(e) => {
                                        setProdType(e.target.value);
                                        setUnit(e.target.value === 'milk' ? 'L' : 'Kg');
                                    }}>
                                        <option value="milk">Milk (Dairy)</option>
                                        <option value="beef">Meat/Beef</option>
                                        <option value="eggs">Eggs (Poultry)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Quantity</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={{ flex: 1 }} />
                                        <span style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)' }}>{unit}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="button-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="button-primary">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Animal</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No production records yet</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td><Calendar size={14} style={{ marginRight: '0.5rem' }} /> {new Date(log.recorded_at).toLocaleDateString()}</td>
                                    <td>{log.livestock_id || 'Bulk/General'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>
                                        {log.production_type === 'milk' ? <Droplets size={14} color="#3b82f6" /> : <Utensils size={14} color="#ef4444" />}
                                        <span style={{ marginLeft: '0.5rem' }}>{log.production_type}</span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{log.quantity} {log.unit}</td>
                                    <td>
                                        <button className="btn-icon danger"><Trash2 size={14} /></button>
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

export default LivestockProduction;
