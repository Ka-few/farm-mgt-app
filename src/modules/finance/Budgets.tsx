import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Budget {
    id: string;
    name: string;
    total_amount: number;
    spent_amount: number;
    start_date: string;
    end_date: string;
    status: string;
}

interface BudgetItem {
    id: string;
    budget_id: string;
    category: string;
    allocated_amount: number;
    spent_amount: number;
    notes?: string;
}

const Budgets: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [showAddBudget, setShowAddBudget] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [budgetForm, setBudgetForm] = useState({
        name: '',
        total_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    const [itemForm, setItemForm] = useState({
        category: 'Seeds',
        allocated_amount: 0,
        notes: ''
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const data: Budget[] = await invoke('get_budgets');
            setBudgets(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchItems = async (budgetId: string) => {
        try {
            const data: BudgetItem[] = await invoke('get_budget_items', { budgetId });
            setBudgetItems(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_budget', {
                name: budgetForm.name,
                totalAmount: budgetForm.total_amount,
                startDate: budgetForm.start_date,
                endDate: budgetForm.end_date
            });
            addToast('Budget created successfully', 'success');
            setShowAddBudget(false);
            fetchBudgets();
        } catch (error) {
            addToast('Failed to create budget', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBudget) return;
        try {
            await invoke('add_budget_item', {
                budgetId: selectedBudget.id,
                category: itemForm.category,
                allocatedAmount: itemForm.allocated_amount,
                notes: itemForm.notes || null
            });
            addToast('Line item added', 'success');
            fetchItems(selectedBudget.id);
            setItemForm({ ...itemForm, allocated_amount: 0, notes: '' });
        } catch (error) {
            addToast('Failed to add item', 'error');
        }
    };

    const selectBudget = (budget: Budget) => {
        setSelectedBudget(budget);
        fetchItems(budget.id);
    };

    return (
        <div className="budgets-module">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Budget Workspace</h2>
                <button className="btn-primary" onClick={() => setShowAddBudget(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> Plan Budget
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedBudget ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
                <div className="budgets-grid" style={{ display: 'grid', gridTemplateColumns: selectedBudget ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {budgets.map(budget => (
                        <div key={budget.id} className={`budget-card glass ${selectedBudget?.id === budget.id ? 'active' : ''}`} onClick={() => selectBudget(budget)} style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: `1px solid ${selectedBudget?.id === budget.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{budget.name}</h3>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>{budget.start_date} to {budget.end_date}</p>
                                </div>
                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: budget.status === 'active' ? 'var(--success-bg)' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '1rem' }}>{budget.status}</span>
                            </div>

                            <div className="progress-section" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                    <span>Spending Progress</span>
                                    <span>{Math.round((budget.spent_amount / budget.total_amount) * 100)}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(budget.spent_amount / budget.total_amount) * 100}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Allocated</p>
                                    <p style={{ margin: 0, fontWeight: 700 }}>KShs {budget.total_amount.toLocaleString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Actual Spent</p>
                                    <p style={{ margin: 0, fontWeight: 700, color: budget.spent_amount > budget.total_amount ? 'var(--error-text)' : 'inherit' }}>KShs {budget.spent_amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedBudget && (
                    <div className="budget-details glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'sticky', top: '1rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>Line Item Allocation</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {budgetItems.map(item => (
                                <div key={item.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{item.category}</span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{Math.round((item.spent_amount / item.allocated_amount) * 100)}% Used</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Budgeted: <b>KShs {item.allocated_amount.toLocaleString()}</b></span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>Spent: KShs {item.spent_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddItem} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>Add Allocation Line</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} style={{ padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}>
                                    <option>Seeds</option>
                                    <option>Fertilizer</option>
                                    <option>Labor</option>
                                    <option>Equipment</option>
                                    <option>Fuel</option>
                                    <option>Marketing</option>
                                    <option>Other</option>
                                </select>
                                <input type="number" placeholder="Allocated Amount" required value={itemForm.allocated_amount} onChange={e => setItemForm({ ...itemForm, allocated_amount: Number(e.target.value) })} style={{ padding: '0.5rem', background: 'var(--bg_input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                                <button type="submit" className="btn-secondary" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '4px', cursor: 'pointer' }}>Add Line Item</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {showAddBudget && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Strategic Budget Planning</h3>
                        <form onSubmit={handleAddBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <input placeholder="Budget Period Name (e.g. Q2 2026)" required value={budgetForm.name} onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <input type="number" placeholder="Total Estimated Budget" required value={budgetForm.total_amount} onChange={e => setBudgetForm({ ...budgetForm, total_amount: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="date" required value={budgetForm.start_date} onChange={e => setBudgetForm({ ...budgetForm, start_date: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                                <input type="date" required value={budgetForm.end_date} onChange={e => setBudgetForm({ ...budgetForm, end_date: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddBudget(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Create Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;
