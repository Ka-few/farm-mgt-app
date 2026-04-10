import React, { useState, useEffect } from 'react';
import { Plus, Map, Home, Trash2, Edit2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

interface Farm {
    id: string;
    name: string;
    currency: string;
    setup_complete: number;
}

interface Plot {
    id: string;
    name: string;
    type: string;
    size: number;
    unit: string;
}

const FarmSetup: React.FC = () => {
    const [farm, setFarm] = useState<Farm | null>(null);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [farmName, setFarmName] = useState('');
    const [currency, setCurrency] = useState('KES');
    const [plotName, setPlotName] = useState('');
    const [plotType, setPlotType] = useState('field');
    const [plotSize, setPlotSize] = useState('');
    const [plotUnit, setPlotUnit] = useState('Acres');
    const [loading, setLoading] = useState(false);
    const [editingPlot, setEditingPlot] = useState<Plot | null>(null);

    const loadFarmData = async () => {
        try {
            const farmResult = await invoke<Farm | null>('get_farm');
            if (farmResult) {
                setFarm(farmResult);
                setFarmName(farmResult.name);
                setCurrency(farmResult.currency || 'KES');
            }

            const plotsResult = await invoke<Plot[]>('get_plots');
            setPlots(plotsResult);
        } catch (err) {
            console.error('Error loading farm data:', err);
        }
    };

    useEffect(() => {
        loadFarmData();
    }, []);

    const handleUpdateFarm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('update_farm', {
                id: farm?.id || null,
                name: farmName,
                currency
            });
            alert('Farm profile updated!');
            loadFarmData();
        } catch (err) {
            console.error(err);
            alert('Error updating farm profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plotName || !plotSize) return;

        try {
            await invoke('add_plot', {
                farmId: farm?.id || null,
                name: plotName,
                plotType,
                size: parseFloat(plotSize),
                unit: plotUnit
            });

            setPlotName('');
            setPlotSize('');
            loadFarmData();
            alert('Plot/Greenhouse added!');
        } catch (err) {
            console.error(err);
            alert('Error adding plot');
        }
    };

    const handleDeletePlot = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this plot/greenhouse? This will not delete crops planted in it, but they will lose their location reference.')) return;
        try {
            await invoke('delete_plot', { id });
            loadFarmData();
        } catch (err) {
            console.error(err);
            alert('Error deleting plot');
        }
    };

    const handleUpdatePlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlot) return;

        try {
            await invoke('update_plot', {
                id: editingPlot.id,
                name: editingPlot.name,
                plotType: editingPlot.type,
                size: editingPlot.size,
                unit: editingPlot.unit
            });
            setEditingPlot(null);
            loadFarmData();
            alert('Plot updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update plot');
        }
    };

    return (
        <div className="farm-setup">
            <div className="welcome-header">
                <div>
                    <h2>Farm Setup & Structure</h2>
                    <p className="subtitle">Configure your farm profile and physical structure.</p>
                </div>
            </div>

            <div className="setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Farm Profile */}
                <div className="form-container glass" style={{ maxWidth: '100%' }}>
                    <h3><Home size={18} /> Farm Profile</h3>
                    <form onSubmit={handleUpdateFarm} className="entry-form">
                        <div className="input-group">
                            <label>Farm Name</label>
                            <input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="e.g. Green Valley Farm" required />
                        </div>
                        <div className="input-group">
                            <label>Default Currency</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                <option value="USD">USD ($)</option>
                                <option value="KES">KES (KShs)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="button-primary" disabled={loading}>Update Profile</button>
                        </div>
                    </form>
                </div>

                {/* Add Plot */}
                <div className="form-container glass" style={{ maxWidth: '100%' }}>
                    <h3><Map size={18} /> Add Plot or Greenhouse</h3>
                    <form onSubmit={handleAddPlot} className="entry-form">
                        <div className="input-group">
                            <label>Plot/Greenhouse Name</label>
                            <input value={plotName} onChange={(e) => setPlotName(e.target.value)} placeholder="e.g. Field Alpha or GH-01" required />
                        </div>
                        <div className="input-group">
                            <label>Type</label>
                            <select value={plotType} onChange={(e) => setPlotType(e.target.value)}>
                                <option value="field">Open Field</option>
                                <option value="greenhouse">Greenhouse</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="input-group" style={{ flex: 2 }}>
                                <label>Size</label>
                                <input type="number" step="0.01" value={plotSize} onChange={(e) => setPlotSize(e.target.value)} placeholder="0.00" required />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Unit</label>
                                <select value={plotUnit} onChange={(e) => setPlotUnit(e.target.value)}>
                                    <option value="Acres">Acres</option>
                                    <option value="Hectares">Hectares</option>
                                    <option value="Sq Meters">Sq Meters</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="button-primary"><Plus size={18} /> Add Structure</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Plots List */}
            <div className="table-container" style={{ marginTop: '2rem' }}>
                <h3>Farm Structure</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Unit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plots.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No plots or greenhouses defined yet.
                                </td>
                            </tr>
                        ) : (
                            plots.map((plot) => (
                                <tr key={plot.id}>
                                    <td style={{ fontWeight: 600 }}>{plot.name}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{plot.type}</td>
                                    <td>{plot.size}</td>
                                    <td>{plot.unit}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn-icon" onClick={() => setEditingPlot(plot)}><Edit2 size={16} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDeletePlot(plot.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Edit Plot Modal */}
            {
                editingPlot && (
                    <div className="modal-overlay">
                        <div className="form-container glass" style={{ maxWidth: '400px', margin: 'auto' }}>
                            <h3>Edit Plot/Greenhouse</h3>
                            <form onSubmit={handleUpdatePlot} className="entry-form">
                                <div className="input-group">
                                    <label>Name</label>
                                    <input
                                        value={editingPlot.name}
                                        onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Type</label>
                                    <select
                                        value={editingPlot.type}
                                        onChange={(e) => setEditingPlot({ ...editingPlot, type: e.target.value })}
                                    >
                                        <option value="field">Open Field</option>
                                        <option value="greenhouse">Greenhouse</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Size</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editingPlot.size}
                                        onChange={(e) => setEditingPlot({ ...editingPlot, size: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Unit</label>
                                    <select
                                        value={editingPlot.unit}
                                        onChange={(e) => setEditingPlot({ ...editingPlot, unit: e.target.value })}
                                    >
                                        <option value="Acres">Acres</option>
                                        <option value="Hectares">Hectares</option>
                                        <option value="Sq Meters">Sq Meters</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="button-primary">Update</button>
                                    <button type="button" onClick={() => setEditingPlot(null)} className="button-secondary">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default FarmSetup;
