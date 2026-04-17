import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Wheat, Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import '../../styles/Forms.css';

interface Crop { id: string; name: string; variety: string; }
interface HarvestRecord {
    id: string;
    crop_id: string;
    crop_name: string;
    quantity: number;
    unit: string;
    harvest_date: string;
    cost: number;
    notes: string | null;
}

const CropHarvesting: React.FC = () => {
    const { addToast } = useToast();
    const [records, setRecords] = useState<HarvestRecord[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [cropId, setCropId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('Kg');
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState<HarvestRecord | null>(null);

    const totalHarvested = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    const loadData = async () => {
        try {
            const r = await invoke<HarvestRecord[]>('get_harvest_records', { cropId: null });
            setRecords(r);
            const c = await invoke<Crop[]>('get_crops');
            setCrops(c);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cropId || !quantity) { addToast('Please select a crop and enter quantity', 'warning'); return; }
        setLoading(true);
        try {
            await invoke('add_harvest_record', {
                cropId,
                quantity: parseFloat(quantity),
                unit,
                harvestDate,
                cost: parseFloat(cost) || 0,
                notes: notes || null
            });
            setCropId(''); setQuantity(''); setCost(''); setNotes('');
            loadData();
            addToast('Harvest record saved successfully', 'success');
        } catch (err) {
            addToast('Error saving harvest record: ' + err, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this harvest record?')) return;
        try {
            await invoke('delete_harvest_record', { id });
            loadData();
            addToast('Harvest record deleted', 'info');
        }
        catch (err) { addToast('Error deleting record: ' + err, 'error'); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;
        try {
            await invoke('update_harvest_record', {
                id: editingRecord.id,
                cropId: editingRecord.crop_id,
                quantity: editingRecord.quantity,
                unit: editingRecord.unit,
                harvestDate: editingRecord.harvest_date,
                cost: editingRecord.cost,
                notes: editingRecord.notes || null
            });
            setEditingRecord(null);
            loadData();
            addToast('Harvest record updated', 'success');
        } catch (err) { addToast('Error updating harvest record: ' + err, 'error'); }
    };

    return (
        <div className="crop-harvesting">
            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>{totalHarvested.toFixed(1)}</span>
                        <span className="stat-label">Total Harvested (all units)</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: 'var(--accent-danger)' }}>KShs {totalCost.toFixed(2)}</span>
                        <span className="stat-label">Total Harvesting Costs</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-body">
                        <span className="stat-value">{records.length}</span>
                        <span className="stat-label">Harvest Sessions</span>
                    </div>
                </div>
            </div>

            {/* Add Form */}
            <div className="form-container glass" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <h3><Wheat size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--accent-primary)' }} />Record Harvest</h3>
                <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Log your yield and associated harvesting costs.</p>
                <form onSubmit={handleSubmit} className="entry-form">
                    <div className="input-group">
                        <label>Crop</label>
                        <select value={cropId} onChange={e => setCropId(e.target.value)} required>
                            <option value="">Select crop...</option>
                            {crops.map(c => <option key={c.id} value={c.id}>{c.name} {c.variety ? `(${c.variety})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Quantity Harvested</label>
                            <input type="number" step="0.1" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.0" required />
                        </div>
                        <div className="input-group">
                            <label>Unit</label>
                            <select value={unit} onChange={e => setUnit(e.target.value)}>
                                <option value="Kg">Kg</option>
                                <option value="Bags">Bags (90Kg)</option>
                                <option value="Crates">Crates</option>
                                <option value="Pieces">Pieces</option>
                                <option value="Tonnes">Tonnes</option>
                                <option value="Litres">Litres</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Harvest Date</label>
                            <input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Cost Incurred (KShs)</label>
                            <input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Notes (Optional)</label>
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Labour, packaging costs..." />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="button-primary" disabled={loading}><Plus size={18} /> Save Harvest</button>
                    </div>
                </form>
            </div>

            {/* Records Table */}
            <div className="table-container">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0 }}>Harvest History</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th><th>Crop</th><th>Quantity</th><th>Harvesting Cost</th><th>Notes</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No harvest records yet.</td></tr>
                        ) : records.map(r => (
                            <tr key={r.id}>
                                <td>{new Date(r.harvest_date).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600 }}>{r.crop_name || '-'}</td>
                                <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{r.quantity} {r.unit}</td>
                                <td>{r.cost > 0 ? `KShs ${r.cost.toFixed(2)}` : '-'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{r.notes || '-'}</td>
                                <td><div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-icon" onClick={() => setEditingRecord(r)}><Edit2 size={14} /></button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '460px' }}>
                        <h3>Edit Harvest Record</h3>
                        <form onSubmit={handleUpdate} className="entry-form">
                            <div className="input-group">
                                <label>Crop</label>
                                <select value={editingRecord.crop_id} onChange={e => setEditingRecord({ ...editingRecord, crop_id: e.target.value })} required>
                                    {crops.map(c => <option key={c.id} value={c.id}>{c.name} {c.variety ? `(${c.variety})` : ''}</option>)}
                                </select>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Quantity</label>
                                    <input type="number" step="0.1" value={editingRecord.quantity} onChange={e => setEditingRecord({ ...editingRecord, quantity: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <div className="input-group">
                                    <label>Unit</label>
                                    <select value={editingRecord.unit} onChange={e => setEditingRecord({ ...editingRecord, unit: e.target.value })}>
                                        <option value="Kg">Kg</option>
                                        <option value="Bags">Bags (90Kg)</option>
                                        <option value="Crates">Crates</option>
                                        <option value="Pieces">Pieces</option>
                                        <option value="Tonnes">Tonnes</option>
                                        <option value="Litres">Litres</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Harvest Date</label>
                                    <input type="date" value={editingRecord.harvest_date} onChange={e => setEditingRecord({ ...editingRecord, harvest_date: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label>Cost (KShs)</label>
                                    <input type="number" step="0.01" value={editingRecord.cost} onChange={e => setEditingRecord({ ...editingRecord, cost: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Notes</label>
                                <input value={editingRecord.notes || ''} onChange={e => setEditingRecord({ ...editingRecord, notes: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="button-primary">Update Record</button>
                                <button type="button" className="button-secondary" onClick={() => setEditingRecord(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropHarvesting;
