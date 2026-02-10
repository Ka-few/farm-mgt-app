import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { getDb, generateId } from '../../core/db';
import '../../styles/Forms.css';

interface Worker {
    id: string;
    name: string;
    role: string;
    daily_rate: number;
    is_active: number;
}

const Workers: React.FC = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [rate, setRate] = useState('');

    const loadWorkers = async () => {
        try {
            const db = await getDb();
            const result = await db.select<Worker[]>('SELECT * FROM workers ORDER BY name ASC');
            setWorkers(result);
        } catch (err) {
            console.error('Failed to load workers:', err);
        }
    };

    useEffect(() => {
        loadWorkers();
    }, []);

    const handleAddWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || !rate) return;

        try {
            const db = await getDb();
            const id = generateId();
            await db.execute(
                'INSERT INTO workers (id, name, role, daily_rate) VALUES ($1, $2, $3, $4)',
                [id, name, role, parseFloat(rate)]
            );

            // Audit
            await db.execute(
                'INSERT INTO audit_events (id, entity_type, entity_id, action, payload) VALUES ($1, $2, $3, $4, $5)',
                [generateId(), 'workers', id, 'create', JSON.stringify({ name, role, rate })]
            );

            setName('');
            setRole('');
            setRate('');
            setShowAdd(false);
            loadWorkers();
        } catch (err) {
            console.error(err);
            alert('Error adding worker');
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
                            <label>Daily Rate ({workers[0]?.role ? 'USD' : 'Currency'})</label>
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
                                    <td>${worker.daily_rate.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${worker.is_active ? 'badge-success' : 'badge-warning'}`}>
                                            {worker.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit"><Edit2 size={16} /></button>
                                            <button className="btn-icon danger" title="Archive"><Trash2 size={16} /></button>
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

export default Workers;
