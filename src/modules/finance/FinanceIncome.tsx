import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import '../../styles/Forms.css';

interface Transaction {
    id: string;
    record_type: 'income';
    category: string;
    amount: number;
    date: string;
    description: string;
}

import { useToast } from '../../context/ToastContext';

const FinanceIncome: React.FC = () => {
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [category, setCategory] = useState('Milk Sales');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            const txs = await invoke<Transaction[]>('get_finance_records');
            setTransactions(txs.filter(t => t.record_type === 'income'));
        } catch (err) {
            console.error('Error loading finance data:', err);
            addToast('Failed to load income records', 'error');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || !date) return;

        setLoading(true);
        try {
            await invoke('add_finance_record', {
                recordType: 'income',
                category,
                amount: parseFloat(amount),
                date,
                description,
                linkedEntityType: null,
                linkedEntityId: null
            });

            setAmount('');
            setDescription('');
            loadData();
            addToast('Income record saved successfully!', 'success');
        } catch (err: any) {
            console.error(err);
            addToast(`Error saving record: ${err}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this income record?')) return;
        try {
            await invoke('delete_finance_record', { id });
            loadData();
            addToast('Income record deleted', 'info');
        } catch (err: any) {
            addToast(`Error deleting record: ${err}`, 'error');
        }
    };

    return (
        <div className="finance-income">
            <div className="form-container glass" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <h3><ArrowUpRight size={20} style={{ display: 'inline', color: 'var(--accent-success)', marginRight: '0.5rem', verticalAlign: 'middle' }} />Record Farm Income</h3>
                <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Log sales from farm products to track total revenue.</p>
                <form onSubmit={handleAddIncome} className="entry-form">
                    <div className="input-group">
                        <label>Product Sold</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Sales Revenue">Sales Revenue (Produce/Livestock)</option>
                            <option value="Service Revenue">Service Revenue (Leasing/Hire)</option>
                            <option value="Contract Revenue">Contract Revenue</option>
                            <option value="Other Operating Revenue">Other Operating Revenue</option>
                            <option value="Interest Income">Interest Income</option>
                            <option value="Dividend Income">Dividend Income</option>
                            <option value="Rental Income">Rental Income</option>
                            <option value="Other Non-operating Revenue">Other Non-operating Revenue</option>
                        </select>
                    </div>
                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Amount (KES)</label>
                            <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                        </div>
                        <div className="input-group">
                            <label>Date of Sale</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Description / Buyer Info (Optional)</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Sold 50 trays to local market..." />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="button-primary" disabled={loading}>
                            <Plus size={18} /> Save Income
                        </button>
                    </div>
                </form>
            </div>

            <div className="table-container">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Sales</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product Category</th>
                            <th>Description</th>
                            <th>Recorded Revenue</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No income records yet.</td></tr>
                        ) : (
                            transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.category}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{tx.description || '-'}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>+KES {tx.amount.toFixed(2)}</td>
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

export default FinanceIncome;
