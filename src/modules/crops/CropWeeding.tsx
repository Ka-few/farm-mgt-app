import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Shovel, Plus, Trash2, FlaskConical, Edit2 } from 'lucide-react';
import '../../styles/Forms.css';

interface Crop { id: string; name: string; variety: string; }
interface WeedRecord {
    id: string;
    crop_id: string;
    crop_name: string;
    mode: string;
    herbicide_name: string | null;
    date: string;
    cost: number;
    notes: string | null;
}

const CropWeeding: React.FC = () => {
    const [records, setRecords] = useState<WeedRecord[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [cropId, setCropId] = useState('');
    const [mode, setMode] = useState('manual');
    const [herbicideName, setHerbicideName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingRecord, setEditingRecord] = useState<WeedRecord | null>(null);

    const loadData = async () => {
        try {
            const r = await invoke<WeedRecord[]>('get_weeding_records', { cropId: null });
            setRecords(r);
            const c = await invoke<Crop[]>('get_crops');
            setCrops(c);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cropId) { alert('Please select a crop.'); return; }
        setLoading(true);
        try {
            await invoke('add_weeding_record', {
                cropId,
                mode,
                herbicideName: mode === 'herbicide' ? herbicideName || null : null,
                date,
                cost: parseFloat(cost) || 0,
                notes: notes || null
            });
            setCropId(''); setHerbicideName(''); setCost(''); setNotes(''); setMode('manual');
            loadData();
            alert('Weeding record saved!');
        } catch (err) {
            alert('Error saving weeding record: ' + err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this weeding record?')) return;
        try { await invoke('delete_weeding_record', { id }); loadData(); }
        catch (err) { alert('Error: ' + err); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;
        try {
            await invoke('update_weeding_record', {
                id: editingRecord.id,
                cropId: editingRecord.crop_id,
                mode: editingRecord.mode,
                herbicideName: editingRecord.herbicide_name || null,
                date: editingRecord.date,
                cost: editingRecord.cost,
                notes: editingRecord.notes || null
            });
            setEditingRecord(null);
            loadData();
        } catch (err) { alert('Error updating record: ' + err); }
    };

    return (
        <div className="crop-weeding">
            <div className="form-container glass" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <h3><Shovel size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--accent-secondary)' }} />Log Weeding Activity</h3>
                <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Record manual or chemical weeding sessions.</p>
                <form onSubmit={handleSubmit} className="entry-form">
                    <div className="input-group">
                        <label>Crop</label>
                        <select value={cropId} onChange={e => setCropId(e.target.value)} required>
                            <option value="">Select crop...</option>
                            {crops.map(c => <option key={c.id} value={c.id}>{c.name} {c.variety ? `(${c.variety})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Mode of Weeding</label>
                        <select value={mode} onChange={e => { setMode(e.target.value); if (e.target.value !== 'herbicide') setHerbicideName(''); }}>
                            <option value="manual">Manual (Hand Weeding)</option>
                            <option value="herbicide">Herbicide (Chemical)</option>
                            <option value="mechanized">Mechanized (Tractor/Equipment)</option>
                        </select>
                    </div>
                    {mode === 'herbicide' && (
                        <div className="input-group" style={{ padding: '0.8rem', background: 'rgba(168, 85, 247, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-secondary)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)' }}>
                                <FlaskConical size={14} /> Herbicide / Chemical Name
                            </label>
                            <input value={herbicideName} onChange={e => setHerbicideName(e.target.value)} placeholder="e.g. Roundup, Gramoxone..." />
                        </div>
                    )}
                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Cost / Expense (KShs)</label>
                            <input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Notes (Optional)</label>
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. 2nd round of weeding..." />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="button-primary" disabled={loading}><Plus size={18} /> Save Record</button>
                    </div>
                </form>
            </div>

            <div className="table-container">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0 }}>Weeding History</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th><th>Crop</th><th>Mode</th><th>Herbicide</th><th>Cost</th><th>Notes</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No weeding records yet.</td></tr>
                        ) : records.map(r => (
                            <tr key={r.id}>
                                <td>{new Date(r.date).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600 }}>{r.crop_name || '-'}</td>
                                <td style={{ textTransform: 'capitalize' }}>
                                    <span className={`badge ${r.mode === 'manual' ? 'badge-info' : r.mode === 'herbicide' ? 'badge-warning' : 'badge-success'}`}>{r.mode}</span>
                                </td>
                                <td>{r.herbicide_name || '-'}</td>
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
                        <h3>Edit Weeding Record</h3>
                        <form onSubmit={handleUpdate} className="entry-form">
                            <div className="input-group">
                                <label>Crop</label>
                                <select value={editingRecord.crop_id} onChange={e => setEditingRecord({ ...editingRecord, crop_id: e.target.value })} required>
                                    {crops.map(c => <option key={c.id} value={c.id}>{c.name} {c.variety ? `(${c.variety})` : ''}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Mode</label>
                                <select value={editingRecord.mode} onChange={e => setEditingRecord({ ...editingRecord, mode: e.target.value })}>
                                    <option value="manual">Manual (Hand Weeding)</option>
                                    <option value="herbicide">Herbicide (Chemical)</option>
                                    <option value="mechanized">Mechanized</option>
                                </select>
                            </div>
                            {editingRecord.mode === 'herbicide' && (
                                <div className="input-group">
                                    <label>Herbicide Name</label>
                                    <input value={editingRecord.herbicide_name || ''} onChange={e => setEditingRecord({ ...editingRecord, herbicide_name: e.target.value })} />
                                </div>
                            )}
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" value={editingRecord.date} onChange={e => setEditingRecord({ ...editingRecord, date: e.target.value })} required />
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

export default CropWeeding;
