import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import '../../styles/Forms.css';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

interface Account {
    id: string;
    code: string;
    name: string;
    account_type: AccountType;
    parent_account_id?: string | null;
    description?: string | null;
}

const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const COA: React.FC = () => {
    const { addToast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formAccount, setFormAccount] = useState<Omit<Account, 'id'>>({
        code: '',
        name: '',
        account_type: 'Asset',
        parent_account_id: null,
        description: '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const result = await invoke<Account[]>('get_accounts');
            setAccounts(result);
        } catch (err) {
            console.error(err);
            addToast('Failed to load chart of accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const resetForm = () => {
        setFormAccount({
            code: '',
            name: '',
            account_type: 'Asset',
            parent_account_id: null,
            description: '',
        });
        setEditingId(null);
    };

    const validateForm = () => {
        if (!formAccount.code.trim() || !formAccount.name.trim()) {
            addToast('Account code and name are required', 'error');
            return false;
        }
        const duplicateCode = accounts.find(a => a.code.toLowerCase() === formAccount.code.trim().toLowerCase() && a.id !== editingId);
        if (duplicateCode) {
            addToast('An account with this code already exists', 'error');
            return false;
        }
        const duplicateName = accounts.find(a => a.name.toLowerCase() === formAccount.name.trim().toLowerCase() && a.id !== editingId);
        if (duplicateName) {
            addToast('An account with this name already exists', 'error');
            return false;
        }
        return true;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSaving(true);

        try {
            if (editingId) {
                await invoke('update_account', {
                    id: editingId,
                    code: formAccount.code.trim(),
                    name: formAccount.name.trim(),
                    accountType: formAccount.account_type,
                    parentAccountId: formAccount.parent_account_id || null,
                    description: formAccount.description?.trim() || null,
                });
                addToast('Account updated successfully', 'success');
            } else {
                await invoke('add_account', {
                    code: formAccount.code.trim(),
                    name: formAccount.name.trim(),
                    accountType: formAccount.account_type,
                    parentAccountId: formAccount.parent_account_id || null,
                    description: formAccount.description?.trim() || null,
                });
                addToast('Account created successfully', 'success');
            }
            await loadAccounts();
            resetForm();
        } catch (err: any) {
            console.error(err);
            addToast(`Failed to save account: ${err}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (account: Account) => {
        setEditingId(account.id);
        setFormAccount({
            code: account.code,
            name: account.name,
            account_type: account.account_type,
            parent_account_id: account.parent_account_id || null,
            description: account.description || '',
        });
    };

    const handleDelete = async (account: Account) => {
        if (!window.confirm(`Delete account ${account.name}?`)) return;
        try {
            await invoke('delete_account', { id: account.id });
            addToast('Account deleted', 'info');
            if (editingId === account.id) resetForm();
            await loadAccounts();
        } catch (err: any) {
            console.error(err);
            addToast(`Failed to delete account: ${err}`, 'error');
        }
    };

    return (
        <div className="coa-page">
            <div className="welcome-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Chart of Accounts</h3>
                    <p className="subtitle">Manage account codes, account types and the farm ledger structure.</p>
                </div>
                <button className="button-primary" onClick={resetForm}>
                    <Plus size={16} /> New Account
                </button>
            </div>

            <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSave} className="entry-form" style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Account Code</label>
                            <input
                                value={formAccount.code}
                                onChange={(e) => setFormAccount(prev => ({ ...prev, code: e.target.value }))}
                                placeholder="e.g. 1000"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Account Name</label>
                            <input
                                value={formAccount.name}
                                onChange={(e) => setFormAccount(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Cash at Bank"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Account Type</label>
                            <select
                                value={formAccount.account_type}
                                onChange={(e) => setFormAccount(prev => ({ ...prev, account_type: e.target.value as AccountType }))}
                            >
                                {accountTypes.map(type => (
                                    <option value={type} key={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Parent Account</label>
                            <select
                                value={formAccount.parent_account_id || ''}
                                onChange={(e) => setFormAccount(prev => ({ ...prev, parent_account_id: e.target.value || null }))}
                            >
                                <option value="">None</option>
                                {accounts.map(account => (
                                    <option value={account.id} key={account.id}>{account.code} - {account.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Description (optional)</label>
                        <input
                            value={formAccount.description || ''}
                            onChange={(e) => setFormAccount(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional account notes"
                        />
                    </div>

                    <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                        <button type="submit" className="button-primary" disabled={saving}>
                            <Save size={16} /> {editingId ? 'Update Account' : 'Create Account'}
                        </button>
                        {editingId && (
                            <button type="button" className="button-secondary" onClick={resetForm}>
                                <X size={16} /> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="table-container glass" style={{ overflowX: 'auto' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Accounts</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Parent</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    {loading ? 'Loading accounts...' : 'No accounts defined yet.'}
                                </td>
                            </tr>
                        ) : (
                            accounts.map(account => (
                                <tr key={account.id}>
                                    <td>{account.code}</td>
                                    <td>{account.name}</td>
                                    <td>{account.account_type}</td>
                                    <td>{accounts.find(a => a.id === account.parent_account_id)?.name || '-'}</td>
                                    <td style={{ maxWidth: '220px', whiteSpace: 'normal' }}>{account.description || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(account)}><Edit2 size={14} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(account)}><Trash2 size={14} /></button>
                                        </div>
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

export default COA;
