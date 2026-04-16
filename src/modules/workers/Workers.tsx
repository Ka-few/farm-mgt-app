import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

interface Worker {
    id: string;
    name: string;
    role: string;
    daily_rate: number;
    is_active: number;
}

import { useToast } from '../../context/ToastContext';

const Workers: React.FC = () => {
    const { addToast } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [rate, setRate] = useState('');
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

    const loadWorkers = async () => {
        try {
            const result = await invoke<Worker[]>('get_workers');
            setWorkers(result);
        } catch (err) {
            console.error('Failed to load workers:', err);
            addToast('Failed to load team members', 'error');
        }
    };

    useEffect(() => {
        loadWorkers();
    }, []);

    const handleAddWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || !rate) return;

        try {
            await invoke('add_worker', {
                name,
                role,
                dailyRate: parseFloat(rate)
            });

            setName('');
            setRole('');
            setRate('');
            setShowAdd(false);
            loadWorkers();
            addToast('Worker added successfully!', 'success');
        } catch (err: any) {
            console.error(err);
            addToast(`Error adding worker: ${err}`, 'error');
        }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this worker? This cannot be undone.')) return;

        try {
            await invoke('delete_worker', { id });
            loadWorkers();
            addToast('Worker archived', 'info');
        } catch (err: any) {
            console.error(err);
            addToast(`Error deleting worker: ${err}`, 'error');
        }
    };

    const handleUpdateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorker) return;

        try {
            await invoke('update_worker', {
                id: editingWorker.id,
                name: editingWorker.name,
                role: editingWorker.role,
                dailyRate: editingWorker.daily_rate,
                isActive: editingWorker.is_active
            });
            setEditingWorker(null);
            loadWorkers();
            addToast('Worker profile updated!', 'success');
        } catch (err: any) {
            console.error(err);
            addToast(`Update failed: ${err}`, 'error');
        }
    };

    return (
        <div className="workers-page">
            <div className="welcome-header">
                <div>
                    <h2>Team Management</h2>
                    <p className="subtitle">Manage your farm workers and labor rates.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(!showAdd)}>
                    <UserPlus size={18} />
                    <span>{showAdd ? 'Cancel' : 'Add Worker'}</span>
                </button>
            </div>

            {showAdd && (
                <div className="form-container glass" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <h3>New Worker Profile</h3>
                    <form onSubmit={handleAddWorker} className="entry-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" required />
                        </div>
                        <div className="input-group">
                            <label>Role / Specialty</label>
                            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Milker, Harvester" required />
                        </div>
                        <div className="input-group">
                            <label>Daily Rate (KShs)</label>
                            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" required />
                        </div>
                        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="button-primary">Save Profile</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Daily Rate</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No workers found. Add your first team member to get started.
                                </td>
                            </tr>
                        ) : (
                            workers.map((worker) => (
                                <tr key={worker.id}>
                                    <td style={{ fontWeight: 600 }}>{worker.name}</td>
                                    <td>{worker.role}</td>
                                    <td>KShs {worker.daily_rate.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${worker.is_active ? 'badge-success' : 'badge-warning'}`}>
                                            {worker.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => setEditingWorker(worker)}><Edit2 size={16} /></button>
                                            <button className="btn-icon danger" title="Archive" onClick={() => handleDeleteWorker(worker.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Edit Modal / Form Overlay */}
            {editingWorker && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '400px', margin: 'auto' }}>
                        <h3>Edit Worker</h3>
                        <form onSubmit={handleUpdateWorker} className="entry-form">
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    value={editingWorker.name}
                                    onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Role</label>
                                <input
                                    value={editingWorker.role || ''}
                                    onChange={(e) => setEditingWorker({ ...editingWorker, role: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Daily Rate (KShs)</label>
                                <input
                                    type="number"
                                    value={editingWorker.daily_rate || 0}
                                    onChange={(e) => setEditingWorker({ ...editingWorker, daily_rate: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="button-primary">Update</button>
                                <button type="button" onClick={() => setEditingWorker(null)} className="button-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workers;
