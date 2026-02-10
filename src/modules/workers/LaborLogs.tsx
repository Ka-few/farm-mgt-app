import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Save } from 'lucide-react';
import { getDb, generateId } from '../../core/db';
import '../../styles/Forms.css';

interface Worker {
    id: string;
    name: string;
    daily_rate: number;
}

interface Plot {
    id: string;
    name: string;
}

const LaborLogs: React.FC = () => {
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
                const db = await getDb();
                const w = await db.select<Worker[]>('SELECT id, name, daily_rate FROM workers WHERE is_active = 1');
                const p = await db.select<Plot[]>('SELECT id, name FROM plots');
                setWorkers(w);
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
            const db = await getDb();
            const worker = workers.find(w => w.id === workerId);
            const amount = worker?.daily_rate || 0;

            const id = generateId();
            await db.execute(
                'INSERT INTO labor_records (id, worker_id, plot_id, activity, date, amount) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, workerId, plotId || null, activity, date, amount]
            );

            // Audit and Finance (Expense)
            await db.execute(
                'INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [generateId(), 'expense', 'Labor', amount, date, `Labor: ${activity} by ${worker?.name}`, 'labor_records', id]
            );

            alert('Labor record saved and added to expenses!');
            setActivity('');
            setWorkerId('');
        } catch (err) {
            console.error(err);
            alert('Error saving labor record');
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
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name} (${w.daily_rate}/day)</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label><MapPin size={14} /> Plot / Area (Optional)</label>
                        <select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                            <option value="">General / Multiple</option>
                            {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
