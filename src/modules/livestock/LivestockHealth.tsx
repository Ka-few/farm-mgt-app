import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../context/ToastContext';

interface HealthRecord {
    id: string;
    livestock_id: string;
    livestock_tag: string;
    livestock_name: string;
    record_date: string;
    record_type: string;
    description: string;
    cost: number;
    next_visit: string;
}

const LivestockHealth: React.FC = () => {
    const { addToast } = useToast();
    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [livestock, setLivestock] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({
        livestockId: '',
        recordDate: new Date().toISOString().split('T')[0],
        recordType: 'vaccination',
        description: '',
        cost: 0,
        nextVisit: ''
    });

    const loadRecords = async () => {
        try {
            const result = await invoke<HealthRecord[]>('get_health_records');
            setRecords(result);
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
        loadRecords();
        loadLivestock();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('add_health_record', {
                ...formData,
                cost: parseFloat(formData.cost.toString()),
                nextVisit: formData.nextVisit || null
            });
            addToast('Health record saved successfully', 'success');
            setShowAdd(false);
            setFormData({
                livestockId: '',
                recordDate: new Date().toISOString().split('T')[0],
                recordType: 'vaccination',
                description: '',
                cost: 0,
                nextVisit: ''
            });
            loadRecords();
        } catch (err) {
            console.error(err);
            addToast('Error saving health record', 'error');
        }
    };

    return (
        <div className="livestock-health">
            <div className="welcome-header">
                <div>
                    <h3>Health Management</h3>
                    <p className="subtitle">Track vaccinations, treatments and medical history.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={18} /> Add Health Record
                </button>
            </div>

            {showAdd && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '500px' }}>
                        <h3>New Health Record</h3>
                        <form onSubmit={handleSubmit} className="entry-form">
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Animal / Tag</label>
                                    <select
                                        value={formData.livestockId}
                                        onChange={(e) => setFormData({ ...formData, livestockId: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-accent)', color: 'black', border: '1px solid var(--glass-border)' }}
                                    >
                                        <option value="">Select Animal...</option>
                                        {livestock.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name ? `${a.name} (${a.tag})` : a.tag} - {a.species}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" value={formData.recordDate} onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Record Type</label>
                                    <select value={formData.recordType} onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}>
                                        <option value="vaccination">Vaccination</option>
                                        <option value="treatment">Treatment</option>
                                        <option value="checkup">Routine Checkup</option>
                                        <option value="surgery">Surgery</option>
                                        <option value="deworming">Deworming</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Cost</label>
                                    <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Description / Notes</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--glass-border)', color: 'black', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                                    placeholder="Enter details about the treatment or vaccination..."
                                />
                            </div>
                            <div className="input-group">
                                <label>Next Follow-up Date (Optional)</label>
                                <input type="date" value={formData.nextVisit} onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })} />
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
                            <th>Description</th>
                            <th>Next Visit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No medical history yet</td></tr>
                        ) : (
                            records.map(record => (
                                <tr key={record.id}>
                                    <td>{record.record_date}</td>
                                    <td>
                                        {record.livestock_tag ? (
                                            <span>{record.livestock_name ? `${record.livestock_name} (${record.livestock_tag})` : record.livestock_tag}</span>
                                        ) : record.livestock_id}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textTransform: 'capitalize' }}>
                                            {record.record_type}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.description}>
                                        {record.description}
                                    </td>
                                    <td>
                                        {record.next_visit ? (
                                            <div style={{ color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                                <Calendar size={12} /> {record.next_visit}
                                            </div>
                                        ) : '-'}
                                    </td>
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

export default LivestockHealth;
