import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ListTodo, Plus, Calendar, User, Clock, CheckCircle2, Circle, Activity } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Task {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    status: string;
    priority: string;
    assigned_worker_id?: string;
    worker_name?: string;
}

interface DailyLog {
    id: string;
    cycle_id?: string;
    task_id?: string;
    worker_id: string;
    worker_name: string;
    activity: string;
    time_spent_hours: number;
    date: string;
    notes?: string;
}

const DailyLogs: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [cycles, setCycles] = useState<any[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddLog, setShowAddLog] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Medium',
        assigned_worker_id: ''
    });

    const [logForm, setLogForm] = useState({
        worker_id: '',
        activity: '',
        time_spent_hours: 1,
        date: new Date().toISOString().split('T')[0],
        cycle_id: '',
        task_id: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
        fetchWorkersAndCycles();
    }, []);

    const fetchData = async () => {
        try {
            const taskData: Task[] = await invoke('get_tasks');
            const logData: DailyLog[] = await invoke('get_daily_logs');
            setTasks(taskData);
            setLogs(logData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchWorkersAndCycles = async () => {
        try {
            const workerData: any[] = await invoke('get_workers');
            const cycleData: any[] = await invoke('get_crop_cycles');
            setWorkers(workerData);
            setCycles(cycleData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_task', {
                title: taskForm.title,
                description: taskForm.description || null,
                dueDate: taskForm.due_date || null,
                priority: taskForm.priority,
                assignedWorkerId: taskForm.assigned_worker_id || null
            });
            addToast('Task created successfully', 'success');
            setShowAddTask(false);
            fetchData();
        } catch (error) {
            addToast('Failed to create task', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_daily_log', {
                workerId: logForm.worker_id,
                activity: logForm.activity,
                timeSpentHours: logForm.time_spent_hours,
                date: logForm.date,
                cycleId: logForm.cycle_id || null,
                taskId: logForm.task_id || null,
                notes: logForm.notes || null
            });
            addToast('Activity logged', 'success');
            setShowAddLog(false);
            fetchData();
        } catch (error) {
            addToast('Failed to log activity', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskStatus = async (task: Task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await invoke('update_task', {
                id: task.id,
                status: newStatus,
                priority: task.priority
            });
            fetchData();
        } catch (error) {
            addToast('Failed to update task', 'error');
        }
    };

    return (
        <div className="daily-logs">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Operational Tracking</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setShowAddLog(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--accent-secondary)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>
                        <Activity size={18} /> Log Activity
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddTask(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <div className="tasks-section glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ListTodo size={18} color="var(--accent-primary)" /> Pending Tasks
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tasks.filter(t => t.status !== 'completed').map(task => (
                            <div key={task.id} className="task-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <button onClick={() => toggleTaskStatus(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent-primary)' }}>
                                    <Circle size={20} />
                                </button>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{task.title}</h4>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                        <span style={{ color: task.priority === 'High' ? 'var(--error-text)' : 'inherit' }}>{task.priority} Priority</span>
                                        {task.due_date && <span>Due: {task.due_date}</span>}
                                        {task.worker_name && <span><User size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> {task.worker_name}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="logs-section glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} color="var(--accent-primary)" /> Recent Activity Logs
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {logs.slice(0, 10).map(log => (
                            <div key={log.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ minWidth: '80px', fontSize: '0.75rem', opacity: 0.6 }}>{log.date}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.worker_name}</div>
                                    <p style={{ margin: '0.1rem 0', fontSize: '0.85rem' }}>{log.activity}</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>{log.time_spent_hours} hrs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAddTask && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '450px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Assign New Task</h3>
                        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <input placeholder="Task Title" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <textarea placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', minHeight: '80px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <select value={taskForm.assigned_worker_id} onChange={e => setTaskForm({ ...taskForm, assigned_worker_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option value="">-- Assign to (Optional) --</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddTask(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddLog && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '450px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Log Daily Activity</h3>
                        <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <select required value={logForm.worker_id} onChange={e => setLogForm({ ...logForm, worker_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option value="">-- Select Worker --</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <input placeholder="Activity Name (e.g., Weeding Plot A)" required value={logForm.activity} onChange={e => setLogForm({ ...logForm, activity: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="number" step="0.5" placeholder="Hours Spent" required value={logForm.time_spent_hours} onChange={e => setLogForm({ ...logForm, time_spent_hours: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                                <input type="date" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            </div>
                            <select value={logForm.cycle_id} onChange={e => setLogForm({ ...logForm, cycle_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option value="">-- Link to Crop Cycle (Optional) --</option>
                                {cycles.map(c => <option key={c.id} value={c.id}>{c.crop_name} - {c.plot_name}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddLog(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Log Work</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyLogs;
