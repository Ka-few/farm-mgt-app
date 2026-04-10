import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

const MilkEntry: React.FC = () => {
    const [livestock, setLivestock] = useState<any[]>([]);
    const [selectedAnimalId, setSelectedAnimalId] = useState('');
    const [morning, setMorning] = useState('');
    const [noon, setNoon] = useState('');
    const [evening, setEvening] = useState('');
    const [loading, setLoading] = useState(false);

    const total = (parseFloat(morning) || 0) + (parseFloat(noon) || 0) + (parseFloat(evening) || 0);

    useEffect(() => {
        const loadLivestock = async () => {
            try {
                const result = await invoke<any[]>('get_livestock');
                setLivestock(result.filter(a => a.status === 'active' && a.species === 'dairy'));
            } catch (err) {
                console.error('Error loading livestock:', err);
            }
        };
        loadLivestock();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAnimalId || total === 0) return;

        setLoading(true);
        try {
            await invoke('record_milk', {
                livestockId: selectedAnimalId,
                quantity: total,
                morningQty: parseFloat(morning) || 0,
                noonQty: parseFloat(noon) || 0,
                eveningQty: parseFloat(evening) || 0,
                recordedAt: new Date().toISOString()
            });

            setSelectedAnimalId('');
            setMorning('');
            setNoon('');
            setEvening('');
            alert('Daily record saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Error saving record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container glass">
            <h3>Daily Milk Entry</h3>
            <p className="form-help">Select the cow and enter quantities for each session.</p>

            <form onSubmit={handleSubmit} className="entry-form">
                <div className="input-group">
                    <label htmlFor="animal">Cow / Animal</label>
                    <select
                        id="animal"
                        value={selectedAnimalId}
                        onChange={(e) => setSelectedAnimalId(e.target.value)}
                        required
                        className="glass-select"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-accent)', color: 'black', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="">Select Animal...</option>
                        {livestock.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name ? `${a.name} (${a.tag})` : a.tag}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    <label>Daily Total (L)</label>
                    <input
                        type="number"
                        value={total.toFixed(1)}
                        readOnly
                        className="glass-input"
                        style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', fontWeight: 'bold', color: 'var(--text-primary)' }}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="button-primary" disabled={loading || total === 0}>
                        <Save size={18} />
                        <span>{loading ? 'Saving...' : 'Save Daily Record'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MilkEntry;
