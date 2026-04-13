import React, { useState, useEffect } from 'react';
import { Droplets, Utensils, Calendar, Plus, Trash2, Edit2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface ProductionLog {
    id: string;
    livestock_id: string;
    livestock_tag: string;
    livestock_name: string;
    production_type: string;
    quantity: number;
    unit: string;
    morning_qty?: number;
    noon_qty?: number;
    evening_qty?: number;
    recorded_at: string;
}

const LivestockProduction: React.FC = () => {
    const [logs, setLogs] = useState<ProductionLog[]>([]);
    const [livestock, setLivestock] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [animalId, setAnimalId] = useState('');
    const [prodType, setProdType] = useState('milk');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('L');
    const [morning, setMorning] = useState('');
    const [noon, setNoon] = useState('');
    const [evening, setEvening] = useState('');

    const totalMilk = (parseFloat(morning) || 0) + (parseFloat(noon) || 0) + (parseFloat(evening) || 0);

    const loadLogs = async () => {
        try {
            const result = await invoke<ProductionLog[]>('get_production_logs');
            setLogs(result);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLivestock = async () => {
        try {
            const result = await invoke<any[]>('get_livestock');
            setLivestock(result.filter(a => a.status === 'active'));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadLogs();
        loadLivestock();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalQuantity = prodType === 'milk' ? totalMilk : parseFloat(quantity);
            const payload = {
                livestockId: animalId || null,
                productionType: prodType,
                quantity: finalQuantity,
                unit,
                morningQty: prodType === 'milk' ? (parseFloat(morning) || 0) : null,
                noonQty: prodType === 'milk' ? (parseFloat(noon) || 0) : null,
                eveningQty: prodType === 'milk' ? (parseFloat(evening) || 0) : null,
                recordedAt: new Date().toISOString()
            };

            if (editingId) {
                await invoke('update_production', { id: editingId, ...payload });
            } else {
                await invoke('record_production', payload);
            }

            setShowAdd(false);
            setEditingId(null);
            setAnimalId('');
            setQuantity('');
            setMorning('');
            setNoon('');
            setEvening('');
            loadLogs();
        } catch (err) {
            alert(`Error ${editingId ? 'updating' : 'recording'} production: ${err}`);
        }
    };

    const handleEditClick = (log: ProductionLog) => {
        setEditingId(log.id);
        setAnimalId(log.livestock_id || '');
        setProdType(log.production_type);
        setQuantity(log.quantity.toString());
        setUnit(log.unit);
        setMorning(log.morning_qty?.toString() || '');
        setNoon(log.noon_qty?.toString() || '');
        setEvening(log.evening_qty?.toString() || '');
        setShowAdd(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await invoke('delete_production', { id });
            loadLogs();
        } catch (err) {
            alert('Error deleting record: ' + err);
        }
    };

    return (
        <div className="livestock-production">
            <div className="welcome-header">
                <div>
                    <h3>Yield & Production</h3>
                    <p className="subtitle">Track milk output and meat/beef production.</p>
                </div>
                <button className="button-primary" onClick={() => {
                    setEditingId(null);
                    setAnimalId(''); setQuantity(''); setMorning(''); setNoon(''); setEvening(''); setProdType('milk'); setUnit('L');
                    setShowAdd(true);
                }}>
                    <Plus size={18} /> Record Production
                </button>
            </div>

            {showAdd && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '450px' }}>
                        <h3>{editingId ? 'Edit Production Record' : 'Record Production'}</h3>
                        <form onSubmit={handleSubmit} className="entry-form">
                            <div className="input-group">
                                <label>Animal / Tag (Optional)</label>
                                <select
                                    value={animalId}
                                    onChange={(e) => setAnimalId(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-accent)', color: 'black', border: '1px solid var(--glass-border)' }}
                                >
                                    <option value="">Bulk / General (No specific animal)</option>
                                    {livestock.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name ? `${a.name} (${a.tag})` : a.tag} - {a.species}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Production Type</label>
                                    <select value={prodType} onChange={(e) => {
                                        setProdType(e.target.value);
                                        setUnit(e.target.value === 'milk' ? 'L' : (e.target.value === 'eggs' ? 'Pieces' : 'Kg'));
                                    }}>
                                        <option value="milk">Milk (Dairy)</option>
                                        <option value="beef">Meat/Beef</option>
                                        <option value="eggs">Eggs (Poultry)</option>
                                    </select>
                                </div>
                                {prodType !== 'milk' && (
                                    <div className="input-group">
                                        <label>Quantity</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="number" step={prodType === 'eggs' ? "1" : "0.1"} min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={{ flex: 1 }} />
                                            <span style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)' }}>{unit}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {prodType === 'milk' && (
                                <>
                                    <div className="input-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="input-group">
                                            <label>Morning (L)</label>
                                            <input type="number" step="0.1" value={morning} onChange={(e) => setMorning(e.target.value)} placeholder="0.0" />
                                        </div>
                                        <div className="input-group">
                                            <label>Noon (L)</label>
                                            <input type="number" step="0.1" value={noon} onChange={(e) => setNoon(e.target.value)} placeholder="0.0" />
                                        </div>
                                        <div className="input-group">
                                            <label>Evening (L)</label>
                                            <input type="number" step="0.1" value={evening} onChange={(e) => setEvening(e.target.value)} placeholder="0.0" />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Total (L)</label>
                                        <input
                                            type="number"
                                            value={totalMilk.toFixed(1)}
                                            readOnly
                                            style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="form-actions">
                                <button type="button" className="button-secondary" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</button>
                                <button type="submit" className="button-primary">{editingId ? 'Update Record' : 'Save Record'}</button>
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
                                    <td>
                                        {log.livestock_tag ? (
                                            <span>{log.livestock_name ? `${log.livestock_name} (${log.livestock_tag})` : log.livestock_tag}</span>
                                        ) : 'Bulk/General'}
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>
                                        {log.production_type === 'milk' ? <Droplets size={14} color="#3b82f6" /> : <Utensils size={14} color="#ef4444" />}
                                        <span style={{ marginLeft: '0.5rem' }}>
                                            {log.production_type}
                                            {log.production_type === 'milk' && (log.morning_qty || log.noon_qty || log.evening_qty) ? (
                                                <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: '0.4rem', display: 'block' }}>
                                                    M:{log.morning_qty || 0} N:{log.noon_qty || 0} E:{log.evening_qty || 0}
                                                </span>
                                            ) : null}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{log.quantity} {log.unit}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" onClick={() => handleEditClick(log)}><Edit2 size={14} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(log.id)}><Trash2 size={14} /></button>
                                        </div>
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
