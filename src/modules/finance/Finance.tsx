import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, Edit2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Forms.css';

interface Transaction {
    id: string;
    record_type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
}

const Finance: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 });
    const [showAdd, setShowAdd] = useState(false);

    // Form state
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const loadData = async () => {
        try {
            const txs = await invoke<Transaction[]>('get_finance_records');
            setTransactions(txs);

            const summ = await invoke<any>('get_finance_summary', { startDate: '1970-01-01' });
            setSummary(summ);
        } catch (err) {
            console.error('Error loading finance data:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || !date) return;

        setLoading(true);
        try {
            await invoke('add_finance_record', {
                recordType: type,
                category,
                amount: parseFloat(amount),
                date,
                description
            });

            setShowAdd(false);
            setCategory('');
            setAmount('');
            setDescription('');
            loadData();
            alert('Transaction saved!');
        } catch (err) {
            console.error(err);
            alert('Error saving transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await invoke('delete_finance_record', { id });
            loadData();
        } catch (err) {
            console.error(err);
            alert('Error deleting transaction');
        }
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        try {
            await invoke('update_finance_record', {
                id: editingTransaction.id,
                recordType: editingTransaction.record_type,
                category: editingTransaction.category,
                amount: editingTransaction.amount,
                date: editingTransaction.date,
                description: editingTransaction.description || ''
            });
            setEditingTransaction(null);
            loadData();
            alert('Transaction updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update transaction');
        }
    };

    return (
        <div className="finance-page">
            <div className="welcome-header">
                <div>
                    <h2>Farm Finances</h2>
                    <p className="subtitle">Monitor profitability and track all transactions.</p>
                </div>
                <button className="button-primary" onClick={() => setShowAdd(!showAdd)}>
                    <Plus size={18} />
                    <span>{showAdd ? 'Cancel' : 'New Transaction'}</span>
                </button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box primary"><TrendingUp size={24} /></div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>KShs {summary.income.toFixed(2)}</span>
                        <span className="stat-label">Total Income</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box danger"><TrendingDown size={24} /></div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: 'var(--accent-danger)' }}>KShs {summary.expenses.toFixed(2)}</span>
                        <span className="stat-label">Total Expenses</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box secondary"><DollarSign size={24} /></div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">KShs {summary.balance.toFixed(2)}</span>
                        <span className="stat-label">Net Profit/Loss</span>
                    </div>
                </div >
            </div >

            {showAdd && (
                <div className="form-container glass" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <h3>Add Transaction</h3>
                    <form onSubmit={handleAddTransaction} className="entry-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Category</label>
                            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Feed, Labor, Sales" required />
                        </div>
                        <div className="input-group">
                            <label>Amount</label>
                            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                        </div>
                        <div className="input-group">
                            <label>Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." />
                        </div>
                        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="button-primary" disabled={loading}>Save Transaction</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Transactions</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => loadData()}><Plus size={16} /></button>
                        <button className="btn-icon"><Filter size={16} /></button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{tx.date}</td>
                                    <td style={{ fontWeight: 600 }}>{tx.category}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{tx.description}</td>
                                    <td>
                                        <span className={`badge ${tx.record_type === 'income' ? 'badge-success' : 'badge-warning'}`}>
                                            {tx.record_type}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: tx.record_type === 'income' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                        {tx.record_type === 'income' ? '+' : '-'}KShs {tx.amount.toFixed(2)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn-icon" onClick={() => setEditingTransaction(tx)}><Edit2 size={14} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDeleteTransaction(tx.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingTransaction && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '500px', margin: 'auto' }}>
                        <h3>Edit Transaction</h3>
                        <form onSubmit={handleUpdateTransaction} className="entry-form">
                            <div className="input-group">
                                <label>Type</label>
                                <select
                                    value={editingTransaction.record_type}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, record_type: e.target.value as 'income' | 'expense' })}
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Category</label>
                                <input
                                    value={editingTransaction.category}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editingTransaction.amount}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={editingTransaction.date}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <input
                                    value={editingTransaction.description || ''}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="button-primary">Update</button>
                                <button type="button" onClick={() => setEditingTransaction(null)} className="button-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
