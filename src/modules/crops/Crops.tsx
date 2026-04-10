import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Trash2, Edit2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

interface Plot {
    id: string;
    name: string;
}

interface Crop {
    id: string;
    plot_id: string;
    plot_name: string;
    name: string;
    variety: string;
    phase: string;
    planting_date: string;
}

const Crops: React.FC = () => {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [variety, setVariety] = useState('');
    const [plotId, setPlotId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

    const loadCrops = async () => {
        try {
            const cropsResult = await invoke<Crop[]>('get_crops');
            setCrops(cropsResult);

            const plotsResult = await invoke<Plot[]>('get_plots');
            setPlots(plotsResult);
        } catch (err) {
            console.error('Error loading crops:', err);
        }
    };

    useEffect(() => {
        loadCrops();
    }, []);

    const handleAddCrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !plotId) return;

        setLoading(true);
        try {
            await invoke('add_crop', {
                plotId,
                name,
                variety,
                date
            });

            setName('');
            setVariety('');
            setShowAdd(false);
            loadCrops();
            alert('Crop record added successfully!');
        } catch (err) {
            console.error(err);
            alert('Error adding crop');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCrop = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this planting record?')) return;
        try {
            await invoke('delete_crop', { id });
            loadCrops();
        } catch (err) {
            console.error(err);
            alert('Error deleting crop');
        }
    };

    const handleUpdateCrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCrop) return;

        try {
            await invoke('update_crop', {
                id: editingCrop.id,
                name: editingCrop.name,
                variety: editingCrop.variety || '',
                phase: editingCrop.phase || '',
                date: editingCrop.planting_date || ''
            });
            setEditingCrop(null);
            loadCrops();
            alert('Crop record updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update crop');
        }
    };

    return (
        <div className="crops-page">
            <div className="welcome-header">
                <div>
                    <h2>Crop Management</h2>
                    <p className="subtitle">Track plantings, life cycles, and harvests.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(!showAdd)}>
                    <Plus size={18} />
                    <span>{showAdd ? 'Cancel' : 'New Planting'}</span>
                </button>
            </div>

            {showAdd && (
                <div className="form-container glass" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <h3>Planting Record</h3>
                    <form onSubmit={handleAddCrop} className="entry-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Crop Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes, Maize" required />
                        </div>
                        <div className="input-group">
                            <label>Variety</label>
                            <input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Money Maker" />
                        </div>
                        <div className="input-group">
                            <label>Plot / Greenhouse</label>
                            <select value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
                                <option value="">Select Location...</option>
                                {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Planting Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="button-primary" disabled={loading}>Save Planting</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Crop Name</th>
                            <th>Variety</th>
                            <th>Location</th>
                            <th>Planting Date</th>
                            <th>Phase</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {crops.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No crops found. Start by recording your first planting.
                                </td>
                            </tr>
                        ) : (
                            crops.map((crop) => (
                                <tr key={crop.id}>
                                    <td style={{ fontWeight: 600 }}>{crop.name}</td>
                                    <td>{crop.variety}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <MapPin size={14} className="icon-secondary" />
                                            {crop.plot_name || 'N/A'}
                                        </div>
                                    </td>
                                    <td>{crop.planting_date}</td>
                                    <td>
                                        <span className="badge badge-info">{crop.phase}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon" title="Edit" onClick={() => setEditingCrop(crop)}><Edit2 size={16} /></button>
                                            <button className="btn-icon danger" title="Delete" onClick={() => handleDeleteCrop(crop.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Edit Modal */}
            {editingCrop && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '400px', margin: 'auto' }}>
                        <h3>Edit Planting</h3>
                        <form onSubmit={handleUpdateCrop} className="entry-form">
                            <div className="input-group">
                                <label>Crop Name</label>
                                <input
                                    value={editingCrop.name}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Variety</label>
                                <input
                                    value={editingCrop.variety || ''}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, variety: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Current Phase</label>
                                <select
                                    value={editingCrop.phase || 'Planting'}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, phase: e.target.value })}
                                >
                                    <option value="Planting">Planting</option>
                                    <option value="Vegetative">Vegetative</option>
                                    <option value="Flowering">Flowering</option>
                                    <option value="Fruit-set">Fruit-set</option>
                                    <option value="Harvesting">Harvesting</option>
                                    <option value="Cleared">Cleared</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Planting Date</label>
                                <input
                                    type="date"
                                    value={editingCrop.planting_date || ''}
                                    onChange={(e) => setEditingCrop({ ...editingCrop, planting_date: e.target.value })}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="button-primary">Update</button>
                                <button type="button" onClick={() => setEditingCrop(null)} className="button-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Crops;
