import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ArrowDownRight, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import '../../styles/Forms.css';

interface Transaction {
    id: string;
    record_type: 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    linked_entity_type?: string | null;
    linked_entity_id?: string | null;
}

const FinanceExpenses: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [category, setCategory] = useState('Feeds');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [linkedEntityId, setLinkedEntityId] = useState('');
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            const txs = await invoke<Transaction[]>('get_finance_records');
            setTransactions(txs.filter(t => t.record_type === 'expense'));
        } catch (err) {
            console.error('Error loading finance data:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || !date) return;

        setLoading(true);
        try {
            await invoke('add_finance_record', {
                recordType: 'expense',
                category,
                amount: parseFloat(amount),
                date,
                description,
                linkedEntityType: linkedEntityId ? 'livestock_species' : null,
                linkedEntityId: linkedEntityId || null
            });

            setAmount('');
            setDescription('');
            setLinkedEntityId('');
            loadData();
            alert('Expense recorded successfully!');
        } catch (err) {
            console.error(err);
            alert('Error saving expense limit');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await invoke('delete_finance_record', { id });
            loadData();
        } catch (err) {
            alert('Error deleting transaction: ' + err);
        }
    };

    return (
        <div className="finance-expenses">
            <div className="form-container glass" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <h3><ArrowDownRight size={20} style={{ display: 'inline', color: 'var(--accent-danger)', marginRight: '0.5rem', verticalAlign: 'middle' }} />Record Farm Expense</h3>
                <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Log input costs such as feeds, veterinary bills, and utilities.</p>

                <form onSubmit={handleAddExpense} className="entry-form">
                    <div className="input-group">
                        <label>Input Category</label>
                        <select value={category} onChange={(e) => {
                            setCategory(e.target.value);
                            if (e.target.value !== 'Feeds' && e.target.value !== 'Veterinary/Medicine') {
                                setLinkedEntityId('');
                            }
                        }}>
                            <option value="Feeds">Feeds & Nutrition (e.g. Dairy Meal)</option>
                            <option value="Veterinary/Medicine">Veterinary & Medicine</option>
                            <option value="Maintenance">Maintenance & Repairs</option>
                            <option value="Labor">Labor/Wages</option>
                            <option value="Utilities">Water & Electricity Utilities</option>
                            <option value="Other Expense">Other Expense</option>
                        </select>
                    </div>

                    {(category === 'Feeds' || category === 'Veterinary/Medicine') && (
                        <div className="input-group" style={{ padding: '0.8rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-primary)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}><LinkIcon size={14} /> Link to Dependant Group (Optional)</label>
                            <select value={linkedEntityId} onChange={(e) => setLinkedEntityId(e.target.value)} style={{ background: 'var(--bg-card)' }}>
                                <option value="">-- General / No specific group --</option>
                                <option value="dairy">Dairy Cows</option>
                                <option value="poultry">Poultry / Layers</option>
                                <option value="beef">Beef Cattle</option>
                                <option value="pigs">Pigs</option>
                                <option value="goats">Goats</option>
                                <option value="sheep">Sheep</option>
                            </select>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'block' }}>Links this specific expense to calculate accurate group profitability later.</span>
                        </div>
                    )}

                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label>Amount (KShs)</label>
                            <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                        </div>
                        <div className="input-group">
                            <label>Date of Purchase</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Description / Details (Required)</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 5x 70KG Bags of Dairy Meal" required />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="button-primary" disabled={loading} style={{ background: 'var(--accent-danger)' }}>
                            <Plus size={18} /> Save Expense
                        </button>
                    </div>
                </form>
            </div>

            <div className="table-container">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Expenses</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Cost</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No expense records yet.</td></tr>
                        ) : (
                            transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {tx.category}
                                        {tx.linked_entity_id && (
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'capitalize', marginTop: '0.2rem' }}>
                                                ↳ Linked: {tx.linked_entity_id}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{tx.description}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>-KShs {tx.amount.toFixed(2)}</td>
                                    <td>
                                        <button className="btn-icon danger" onClick={() => handleDelete(tx.id)}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceExpenses;
