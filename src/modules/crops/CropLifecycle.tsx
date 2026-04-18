import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Calendar, CheckCircle, Clock, Plus, BarChart3, ChevronRight, Activity } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CropCycle {
    id: string;
    crop_id: string;
    crop_name: string;
    plot_id: string;
    plot_name: string;
    status: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    created_at: string;
}

interface CropStage {
    id: string;
    cycle_id: string;
    stage: string;
    started_at: string;
    notes?: string;
}

const CropLifecycle: React.FC = () => {
    const [cycles, setCycles] = useState<CropCycle[]>([]);
    const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null);
    const [stages, setStages] = useState<CropStage[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Form states
    const [crops, setCrops] = useState<any[]>([]);
    const [plots, setPlots] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        crop_id: '',
        plot_id: '',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [stageData, setStageData] = useState({
        stage: 'Vegetative',
        started_at: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        fetchCycles();
        fetchCropsAndPlots();
    }, []);

    const fetchCycles = async () => {
        try {
            const data: CropCycle[] = await invoke('get_crop_cycles');
            setCycles(data);
        } catch (error) {
            console.error(error);
            addToast('Failed to fetch crop cycles', 'error');
        }
    };

    const fetchCropsAndPlots = async () => {
        try {
            const cropData: any[] = await invoke('get_crops');
            const plotData: any[] = await invoke('get_plots');
            setCrops(cropData);
            setPlots(plotData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStages = async (cycleId: string) => {
        try {
            const data: CropStage[] = await invoke('get_crop_stages', { cycleId });
            setStages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddCycle = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_crop_cycle', {
                cropId: formData.crop_id,
                plotId: formData.plot_id,
                startDate: formData.start_date,
                notes: formData.notes || null
            });
            addToast('Crop cycle added successfully!', 'success');
            setShowAddForm(false);
            fetchCycles();
        } catch (error) {
            addToast('Failed to add crop cycle', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCycle) return;
        try {
            await invoke('add_crop_stage', {
                cycleId: selectedCycle.id,
                stage: stageData.stage,
                started_at: stageData.started_at,
                notes: stageData.notes || null
            });
            addToast('Stage recorded!', 'success');
            fetchStages(selectedCycle.id);
            setStageData({ ...stageData, notes: '' });
        } catch (error) {
            addToast('Failed to record stage', 'error');
        }
    };

    const selectCycle = (cycle: CropCycle) => {
        setSelectedCycle(cycle);
        fetchStages(cycle.id);
    };

    return (
        <div className="crop-lifecycle">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Active Lifecycles</h2>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddForm(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                    <Plus size={18} /> New Cycle
                </button>
            </div>

            <div className="lifecycle-grid" style={{ display: 'grid', gridTemplateColumns: selectedCycle ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                <div className="cycles-list glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    {cycles.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <Clock size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No active crop cycles found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cycles.map(cycle => (
                                <div
                                    key={cycle.id}
                                    className={`cycle-card ${selectedCycle?.id === cycle.id ? 'active' : ''}`}
                                    onClick={() => selectCycle(cycle)}
                                    style={{
                                        padding: '1rem',
                                        background: selectedCycle?.id === cycle.id ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${selectedCycle?.id === cycle.id ? 'var(--accent-primary)' : 'transparent'}`,
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{cycle.crop_name}</h3>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cycle.plot_name}</p>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.5rem',
                                            background: cycle.status === 'active' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                            color: cycle.status === 'active' ? 'var(--success-text)' : 'var(--warning-text)',
                                            borderRadius: '1rem',
                                            textTransform: 'capitalize'
                                        }}>
                                            {cycle.status}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={14} /> {cycle.start_date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedCycle && (
                    <div className="cycle-details glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'sticky', top: '1rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{selectedCycle.crop_name} Timeline</h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Lifecycle details and progression</p>
                        </div>

                        <div className="stages-timeline" style={{ marginBottom: '2rem' }}>
                            {stages.length === 0 ? (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No stages recorded yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {stages.map((stage, idx) => (
                                        <div key={stage.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                            {idx !== stages.length - 1 && (
                                                <div style={{ position: 'absolute', left: '9px', top: '20px', bottom: '-26px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                                            )}
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                                                <CheckCircle size={12} color="white" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{stage.stage}</h4>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stage.started_at}</span>
                                                </div>
                                                {stage.notes && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stage.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddStage} className="add-stage-form" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>Advance to Next Stage</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <select
                                    value={stageData.stage}
                                    onChange={e => setStageData({ ...stageData, stage: e.target.value })}
                                    style={{ padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                >
                                    <option>Gemination</option>
                                    <option>Vegetative</option>
                                    <option>Flowering</option>
                                    <option>Ripening</option>
                                    <option>Harvest Ready</option>
                                    <option>Completed</option>
                                </select>
                                <input
                                    type="date"
                                    value={stageData.started_at}
                                    onChange={e => setStageData({ ...stageData, started_at: e.target.value })}
                                    style={{ padding: '0.5rem', background: 'var(--bg_input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                />
                                <textarea
                                    placeholder="Stage notes..."
                                    value={stageData.notes}
                                    onChange={e => setStageData({ ...stageData, notes: e.target.value })}
                                    style={{ padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', resize: 'vertical', minHeight: '60px' }}
                                />
                                <button type="submit" className="btn-secondary" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                    Record Transition
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {showAddForm && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Start New Cycle</h3>
                        <form onSubmit={handleAddCycle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Select Crop</label>
                                <select
                                    required
                                    value={formData.crop_id}
                                    onChange={e => setFormData({ ...formData, crop_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                >
                                    <option value="">-- Choose Crop --</option>
                                    {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Planting Plot</label>
                                <select
                                    required
                                    value={formData.plot_id}
                                    onChange={e => setFormData({ ...formData, plot_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                >
                                    <option value="">-- Choose Plot --</option>
                                    {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', minHeight: '80px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>
                                    {loading ? 'Starting...' : 'Start Cycle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropLifecycle;
