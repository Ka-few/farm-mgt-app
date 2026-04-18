import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Database, ArrowRightLeft, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface InputItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    unit_price: number;
    stock_quantity: number;
}

interface InputUsageRecord {
    id: string;
    cycle_id: string;
    input_id: string;
    input_name: string;
    quantity: number;
    cost: number;
    date: string;
    notes?: string;
}

const InputUsage: React.FC = () => {
    const [inputs, setInputs] = useState<InputItem[]>([]);
    const [usageRecords, setUsageRecords] = useState<InputUsageRecord[]>([]);
    const [cycles, setCycles] = useState<any[]>([]);
    const [showAddInput, setShowAddInput] = useState(false);
    const [showRecordUsage, setShowRecordUsage] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [inputForm, setInputForm] = useState({
        name: '',
        category: 'Fertilizer',
        unit: 'KG',
        unit_price: 0,
        stock_quantity: 0
    });

    const [usageForm, setUsageForm] = useState({
        cycle_id: '',
        input_id: '',
        quantity: 0,
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const inputData: InputItem[] = await invoke('get_inputs');
            const usageData: InputUsageRecord[] = await invoke('get_input_usage');
            const cycleData: any[] = await invoke('get_crop_cycles');
            setInputs(inputData);
            setUsageRecords(usageData);
            setCycles(cycleData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddInput = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_input', {
                name: inputForm.name,
                category: inputForm.category,
                unit: inputForm.unit,
                unitPrice: inputForm.unit_price,
                stockQuantity: inputForm.stock_quantity
            });
            addToast('Input added to inventory', 'success');
            setShowAddInput(false);
            fetchData();
        } catch (error) {
            addToast('Failed to add input', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const input = inputs.find(i => i.id === usageForm.input_id);
            if (!input) return;

            const cost = input.unit_price * usageForm.quantity;
            const date = new Date().toISOString().split('T')[0];

            await invoke('record_input_usage', {
                cycleId: usageForm.cycle_id,
                inputId: usageForm.input_id,
                quantity: usageForm.quantity,
                cost: cost,
                date: date,
                notes: usageForm.notes || null
            });
            addToast('Usage recorded and stock updated', 'success');
            setShowRecordUsage(false);
            fetchData();
        } catch (error) {
            addToast('Failed to record usage', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="input-usage">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Input Inventory & Usage</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => setShowRecordUsage(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--accent-secondary)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>
                        <ArrowRightLeft size={18} /> Record Application
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddInput(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={18} /> New Stock
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="inventory-section glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={18} color="var(--accent-primary)" /> Inventory
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {inputs.map(input => (
                            <div key={input.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{input.name}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{input.category}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: input.stock_quantity < 5 ? 'var(--error-text)' : 'inherit' }}>
                                        {input.stock_quantity} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>{input.unit}</span>
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--accent-secondary)' }}>${input.unit_price}/{input.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="usage-history glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} color="var(--accent-primary)" /> Application History
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Input</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cost</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Date</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cycle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usageRecords.map(record => (
                                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{record.input_name}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{record.quantity}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--error-text)' }}>-${record.cost}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{record.date}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{record.cycle_id.substring(0, 8)}...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals... (Simplified for brevity) */}
            {showAddInput && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Add Inventory Item</h3>
                        <form onSubmit={handleAddInput} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input placeholder="Item Name" required value={inputForm.name} onChange={e => setInputForm({ ...inputForm, name: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <select value={inputForm.category} onChange={e => setInputForm({ ...inputForm, category: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option>Fertilizer</option>
                                <option>Pesticide</option>
                                <option>Herbicide</option>
                                <option>Seeds</option>
                                <option>Tools</option>
                            </select>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input placeholder="Unit (KG, L, etc)" required value={inputForm.unit} onChange={e => setInputForm({ ...inputForm, unit: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                                <input type="number" placeholder="Unit Price" required value={inputForm.unit_price} onChange={e => setInputForm({ ...inputForm, unit_price: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            </div>
                            <input type="number" placeholder="Initial Stock" required value={inputForm.stock_quantity} onChange={e => setInputForm({ ...inputForm, stock_quantity: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddInput(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRecordUsage && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Record Input Application</h3>
                        <form onSubmit={handleRecordUsage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <select required value={usageForm.input_id} onChange={e => setUsageForm({ ...usageForm, input_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option value="">-- Choose Input --</option>
                                {inputs.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock_quantity} remaining)</option>)}
                            </select>
                            <select required value={usageForm.cycle_id} onChange={e => setUsageForm({ ...usageForm, cycle_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                <option value="">-- Choose Crop Cycle --</option>
                                {cycles.map(c => <option key={c.id} value={c.id}>{c.crop_name} - {c.plot_name}</option>)}
                            </select>
                            <input type="number" placeholder="Quantity Applied" required value={usageForm.quantity} onChange={e => setUsageForm({ ...usageForm, quantity: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <textarea placeholder="Notes (optional)" value={usageForm.notes} onChange={e => setUsageForm({ ...usageForm, notes: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowRecordUsage(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Apply</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InputUsage;
