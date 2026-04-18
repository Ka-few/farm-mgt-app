import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Payroll {
    id: string;
    worker_id: string;
    worker_name: string;
    period_start: string;
    period_end: string;
    days_worked: number;
    total_amount: number;
    payment_status: string;
}

const Payroll: React.FC = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [showRunPayroll, setShowRunPayroll] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [payrollForm, setPayrollForm] = useState({
        worker_id: '',
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchPayrolls();
        fetchWorkers();
    }, []);

    const fetchPayrolls = async () => {
        try {
            const data: Payroll[] = await invoke('get_payroll');
            setPayrolls(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchWorkers = async () => {
        try {
            const data: any[] = await invoke('get_workers');
            setWorkers(data.filter(w => w.is_active === 1));
        } catch (error) {
            console.error(error);
        }
    };

    const handleRunPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('generate_payroll', {
                workerId: payrollForm.worker_id,
                periodStart: payrollForm.period_start,
                periodEnd: payrollForm.period_end
            });
            addToast('Payroll generated and expenses logged!', 'success');
            setShowRunPayroll(false);
            fetchPayrolls();
        } catch (error) {
            addToast('Failed to generate payroll. Check attendance records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payroll-module">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Payroll Management</h2>
                <button className="btn-primary" onClick={() => setShowRunPayroll(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> Generate Payroll
                </button>
            </div>

            <div className="payroll-list glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '1rem' }}>Worker Name</th>
                            <th style={{ padding: '1rem' }}>Period</th>
                            <th style={{ padding: '1rem' }}>Days</th>
                            <th style={{ padding: '1rem' }}>Amount</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No payroll records found.</td>
                            </tr>
                        ) : (
                            payrolls.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{p.worker_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{p.period_start} to {p.period_end}</td>
                                    <td style={{ padding: '1rem' }}>{p.days_worked}</td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>KShs {p.total_amount.toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CheckCircle size={14} /> {p.payment_status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showRunPayroll && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Run Payroll Cycle</h3>
                        <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>This will calculate wages based on attendance records and record a financial expense.</p>
                        <form onSubmit={handleRunPayroll} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Worker</label>
                                <select required value={payrollForm.worker_id} onChange={e => setPayrollForm({ ...payrollForm, worker_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                    <option value="">-- Choose Worker --</option>
                                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period Start</label>
                                <input type="date" required value={payrollForm.period_start} onChange={e => setPayrollForm({ ...payrollForm, period_start: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period End</label>
                                <input type="date" required value={payrollForm.period_end} onChange={e => setPayrollForm({ ...payrollForm, period_end: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowRunPayroll(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>
                                    {loading ? 'Processing...' : 'Calculate & Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
