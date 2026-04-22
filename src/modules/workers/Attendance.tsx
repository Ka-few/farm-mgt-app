import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CalendarCheck, Save, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Worker {
    id: string;
    name: string;
    role: string;
}

interface Attendance {
    worker_id: string;
    worker_name: string;
    date: string;
    status: string;
}

const Attendance: React.FC = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const fetchWorkers = async () => {
        try {
            const data: Worker[] = await invoke('get_workers');
            setWorkers(data.filter((w: any) => w.is_active === 1));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const data: Attendance[] = await invoke('get_attendance', { date });
            const mapping: Record<string, string> = {};
            data.forEach(a => {
                mapping[a.worker_id] = a.status;
            });
            setAttendance(mapping);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = (workerId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [workerId]: status }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            for (const workerId in attendance) {
                await invoke('record_attendance', {
                    workerId,
                    date,
                    status: attendance[workerId]
                });
            }
            addToast('Attendance saved successfully', 'success');
        } catch (error) {
            addToast('Failed to save attendance', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="attendance-module">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CalendarCheck size={20} color="var(--accent-primary)" />
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={{ padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>

            <div className="attendance-list glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '1rem' }}>Worker Name</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(worker => (
                            <tr key={worker.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{worker.name}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', opacity: 0.7 }}>{worker.role}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleStatusChange(worker.id, 'present')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                                background: attendance[worker.id] === 'present' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(0,0,0,0.05)',
                                                color: attendance[worker.id] === 'present' ? 'var(--accent-success)' : 'var(--text-secondary)',
                                                fontWeight: attendance[worker.id] === 'present' ? 600 : 400
                                            }}
                                        >
                                            <CheckCircle size={16} /> Present
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(worker.id, 'absent')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                                background: attendance[worker.id] === 'absent' ? 'rgba(198, 40, 40, 0.15)' : 'rgba(0,0,0,0.05)',
                                                color: attendance[worker.id] === 'absent' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                                                fontWeight: attendance[worker.id] === 'absent' ? 600 : 400
                                            }}
                                        >
                                            <XCircle size={16} /> Absent
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Attendance;
