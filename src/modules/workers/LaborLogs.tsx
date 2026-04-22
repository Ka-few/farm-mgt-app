import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Save } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../context/ToastContext';
import '../../styles/Forms.css';

interface Worker {
    id: string;
    name: string;
    daily_rate: number;
}

interface Plot {
    id: string;
    name: string;
    type: string;
}

const LaborLogs: React.FC = () => {
    const { addToast } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [workerId, setWorkerId] = useState('');
    const [plotId, setPlotId] = useState('');
    const [activity, setActivity] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const w = await invoke<Worker[]>('get_workers');
                const p = await invoke<Plot[]>('get_plots');
                setWorkers(w.filter((worker: any) => worker.is_active === 1));
                setPlots(p);
            } catch (err) {
                console.error(err);
            }
        };
        loadMetadata();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workerId || !activity || !date) return;

        setLoading(true);
        try {
            const worker = workers.find(w => w.id === workerId);
            const amount = worker?.daily_rate || 0;

            await invoke('record_labor', {
                workerId,
                plotId: plotId || null,
                activity,
                date,
                amount
            });

            addToast('Labor record saved and added to expenses', 'success');
            setActivity('');
            setWorkerId('');
        } catch (err) {
            console.error(err);
            addToast('Error saving labor record', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="labor-logs">
            <div className="welcome-header">
                <div>
                    <h2>Labor & Attendance</h2>
                    <p className="subtitle">Log daily work activities and automate wage tracking.</p>
                </div>
            </div>

            <div className="form-container glass" style={{ maxWidth: '600px' }}>
                <h3>Daily Labor Entry</h3>
                <form onSubmit={handleSubmit} className="entry-form">
                    <div className="input-group">
                        <label><User size={14} /> Worker</label>
                        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} required>
                            <option value="">Select Worker...</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name} (Kshs {w.daily_rate}/day)</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label><MapPin size={14} /> Plot / Area (Optional)</label>
                        <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                            <option value="">General / Multiple</option>
                            {plots.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.type === 'greenhouse' ? 'Greenhouse' : 'Open Field'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label><Clock size={14} /> Activity / Task</label>
                        <input
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            placeholder="e.g. Weeding, Fertilizing, Milking"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Calendar size={14} /> Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="button-primary" disabled={loading}>
                            <Save size={18} />
                            <span>{loading ? 'Saving...' : 'Submit Entry'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LaborLogs;
