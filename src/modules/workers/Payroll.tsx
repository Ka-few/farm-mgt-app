import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, CheckCircle, Edit2, Trash2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../context/ToastContext';

interface Payroll {
    id: string;
    worker_id: string;
    worker_name: string;
    period_start: string;
    period_end: string;
    base_pay: number;
    bonus: number;
    deductions: number;
    total_pay: number;
    status: string;
}

const Payroll: React.FC = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [showRunPayroll, setShowRunPayroll] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
    const [loading, setLoading] = useState(false);
    const [printingId, setPrintingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const [payrollForm, setPayrollForm] = useState({
        worker_id: '',
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        bonus: 0,
        deductions: 0
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


    const handlePrintPayslip = async (p: Payroll) => {
        setPrintingId(p.id);
        try {
            const jsPDFClass: any = (jsPDF as any).default || jsPDF;
            const doc = new jsPDFClass();

            // Branding
            doc.setFontSize(22);
            doc.setTextColor(31, 111, 67);
            doc.text('SHAMBASMART', 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(74, 85, 80);
            doc.text('OFFICIAL PAYSLIP', 105, 30, { align: 'center' });

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);

            // Information
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Worker: ${p.worker_name || 'N/A'}`, 20, 50);
            doc.text(`Period: ${p.period_start} to ${p.period_end}`, 20, 60);

            const tableBody = [
                ['Base Pay', (Number(p.base_pay) || 0).toLocaleString()],
                ['Bonus', `+ ${(Number(p.bonus) || 0).toLocaleString()}`],
                ['Deductions', `- ${(Number(p.deductions) || 0).toLocaleString()}`],
                ['NET PAY', (Number(p.total_pay) || 0).toLocaleString()]
            ];

            autoTable(doc, {
                startY: 70,
                head: [['Item', 'Amount (Kshs)']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [31, 111, 67] }
            });

            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.setFontSize(10);
            doc.text('Computer-generated. Saved to Downloads folder.', 105, finalY + 20, { align: 'center' });

            // Native Save via Rust
            const fileName = `Payslip_${(p.worker_name || 'Worker').replace(/\s+/g, '_')}.pdf`;
            const pdfBytes = doc.output('arraybuffer');

            await invoke('save_pdf', {
                filename: fileName,
                content: Array.from(new Uint8Array(pdfBytes))
            });

            addToast(`Payslip saved to Downloads!`, 'success');
        } catch (err: any) {
            console.error('PDF Native Save Error:', err);
            addToast('Failed to save PDF natively.', 'error');
        } finally {
            setPrintingId(null);
        }
    };

    const handleRunPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('generate_payroll', {
                workerId: payrollForm.worker_id,
                periodStart: payrollForm.period_start,
                periodEnd: payrollForm.period_end,
                bonus: Number(payrollForm.bonus) || 0,
                deductions: Number(payrollForm.deductions) || 0
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

    const handleDeletePayroll = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
        try {
            await invoke('delete_payroll', { id });
            addToast('Payroll record deleted', 'info');
            fetchPayrolls();
        } catch (error) {
            addToast('Failed to delete payroll record', 'error');
            console.error(error);
        }
    };

    const handleCompletePayment = async (id: string) => {
        try {
            await invoke('complete_payroll_payment', { id });
            addToast('Payment marked as Complete!', 'success');
            fetchPayrolls();
        } catch (error) {
            addToast('Failed to mark payment as complete', 'error');
            console.error(error);
        }
    };

    const handleUpdatePayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPayroll) return;
        setLoading(true);
        try {
            await invoke('update_payroll', {
                id: editingPayroll.id,
                periodStart: editingPayroll.period_start,
                periodEnd: editingPayroll.period_end,
                bonus: editingPayroll.bonus || 0,
                deductions: editingPayroll.deductions || 0
            });
            addToast('Payroll updated successfully!', 'success');
            setEditingPayroll(null);
            fetchPayrolls();
        } catch (error) {
            addToast('Failed to update payroll', 'error');
            console.error(error);
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
                            <th style={{ padding: '1rem' }}>Base Pay</th>
                            <th style={{ padding: '1rem' }}>Net +/-</th>
                            <th style={{ padding: '1rem' }}>Total Pay</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No payroll records found.</td>
                            </tr>
                        ) : (
                            payrolls.map((p: Payroll) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{p.worker_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{p.period_start} to {p.period_end}</td>
                                    <td style={{ padding: '1rem' }}>Kshs {p.base_pay?.toLocaleString() ?? 0}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--success-text)' }}>+{p.bonus?.toLocaleString() ?? 0}</span> / <span style={{ color: 'var(--error-text)' }}>-{p.deductions?.toLocaleString() ?? 0}</span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>Kshs {p.total_pay?.toLocaleString() ?? 0}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CheckCircle size={14} /> {p.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {p.status !== 'Paid' && (
                                                <button className="btn-icon" onClick={() => handleCompletePayment(p.id)} title="Mark as Paid" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success-text)' }}>
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button className="btn-icon" onClick={() => setEditingPayroll(p)} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handlePrintPayslip(p)}
                                                disabled={printingId === p.id}
                                                title="Print Payslip"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: printingId === p.id ? 'wait' : 'pointer',
                                                    color: 'var(--accent-primary)',
                                                    opacity: printingId === p.id ? 0.5 : 1
                                                }}
                                            >
                                                <Printer size={16} className={printingId === p.id ? 'animate-pulse' : ''} />
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDeletePayroll(p.id)} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error-text)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
                                <select required value={payrollForm.worker_id} onChange={e => setPayrollForm({ ...payrollForm, worker_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                                    <option value="">-- Choose Worker --</option>
                                    {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period Start</label>
                                <input type="date" required value={payrollForm.period_start} onChange={e => setPayrollForm({ ...payrollForm, period_start: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period End</label>
                                <input type="date" required value={payrollForm.period_end} onChange={e => setPayrollForm({ ...payrollForm, period_end: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Bonus (Kshs)</label>
                                <input type="number" value={payrollForm.bonus} onChange={e => setPayrollForm({ ...payrollForm, bonus: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Deductions (Kshs)</label>
                                <input type="number" value={payrollForm.deductions} onChange={e => setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
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

            {editingPayroll && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Edit Payroll</h3>
                        <form onSubmit={handleUpdatePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period Start</label>
                                <input type="date" required value={editingPayroll.period_start} onChange={e => setEditingPayroll({ ...editingPayroll, period_start: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Period End</label>
                                <input type="date" required value={editingPayroll.period_end} onChange={e => setEditingPayroll({ ...editingPayroll, period_end: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Bonus (Kshs)</label>
                                <input type="number" value={editingPayroll.bonus} onChange={e => setEditingPayroll({ ...editingPayroll, bonus: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Deductions (Kshs)</label>
                                <input type="number" value={editingPayroll.deductions} onChange={e => setEditingPayroll({ ...editingPayroll, deductions: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditingPayroll(null)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>
                                    {loading ? 'Updating...' : 'Save Updates'}
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
