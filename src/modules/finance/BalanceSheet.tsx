import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Save, RefreshCw, TrendingUp, TrendingDown, Landmark, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BalanceEntry {
    account_name: string;
    amount: number;
    updated_at?: string;
}

interface AccountRow {
    key: string;
    originalName?: string;
    account_name: string;
    amount: number;
}

const BalanceSheet: React.FC = () => {
    const { addToast } = useToast();
    const [rows, setRows] = useState<AccountRow[]>([]);
    const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await invoke<BalanceEntry[]>('get_balance_sheet');
            const rowList: AccountRow[] = data.map((e, idx) => ({
                key: `${e.account_name}-${idx}`,
                originalName: e.account_name,
                account_name: e.account_name,
                amount: e.amount,
            }));
            setRows(rowList.length ? rowList : [{ key: 'new-0', account_name: '', amount: 0 }] );
            setRowsToDelete([]);
        } catch (err) {
            console.error(err);
            addToast('Failed to load balance sheet data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRowChange = (key: string, field: 'account_name' | 'amount', value: string) => {
        setRows(prev => prev.map(row => {
            if (row.key !== key) return row;
            return {
                ...row,
                account_name: field === 'account_name' ? value : row.account_name,
                amount: field === 'amount' ? parseFloat(value) || 0 : row.amount,
            };
        }));
    };

    const handleAddRow = () => {
        setRows(prev => [...prev, { key: `new-${Date.now()}`, account_name: '', amount: 0 }]);
    };

    const handleDeleteRow = (key: string) => {
        setRows(prev => {
            const row = prev.find(r => r.key === key);
            if (row?.originalName) {
                setRowsToDelete(prevDelete => [...prevDelete, row.originalName!]);
            }
            return prev.filter(r => r.key !== key);
        });
    };

    const duplicateAccountNames = Array.from(
        new Set(
            rows
                .map(row => row.account_name.trim())
                .filter((name, index, arr) => name && arr.indexOf(name) !== index)
        )
    );
    const hasDuplicateNames = duplicateAccountNames.length > 0;

    const handleSave = async () => {
        const normalizedRows = rows.map(row => ({ ...row, account_name: row.account_name.trim() }));
        if (normalizedRows.some(row => !row.account_name)) {
            addToast('All account rows must have a name', 'error');
            return;
        }

        const accountNames = normalizedRows.map(row => row.account_name);
        const duplicates = accountNames.filter((name, index) => accountNames.indexOf(name) !== index);
        if (duplicates.length) {
            addToast('Duplicate account names are not allowed', 'error');
            return;
        }

        setSaving(true);
        try {
            for (const accountName of rowsToDelete) {
                await invoke('delete_balance_sheet_entry', { accountName });
            }

            for (const row of normalizedRows) {
                await invoke('update_balance_sheet_entry', {
                    accountName: row.account_name,
                    amount: row.amount,
                });
            }

            addToast('Chart of accounts saved successfully', 'success');
            await loadData();
        } catch (err) {
            console.error(err);
            addToast('Error saving chart of accounts', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (account: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setRows(prev => {
            const existingIndex = prev.findIndex(row => row.account_name === account);
            if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = { ...next[existingIndex], amount };
                return next;
            }
            return [
                ...prev,
                {
                    key: `new-${Date.now()}`,
                    originalName: account,
                    account_name: account,
                    amount,
                },
            ];
        });
    };

    const accountMap: Record<string, number> = rows.reduce((map, row) => {
        if (row.account_name.trim()) {
            map[row.account_name] = row.amount;
        }
        return map;
    }, {} as Record<string, number>);

    const getVal = (key: string) => accountMap[key] || 0;

    const totalCurrentAssets = getVal('Cash at Bank') + getVal('Accounts Receivable') + getVal('Inventory - Crops') + getVal('Inventory - Livestock Feed') + getVal('Produced Goods Stock') + getVal('Prepaid Expenses');
    const totalNonCurrentAssets = getVal('Land') + getVal('Buildings') + getVal('Farm Machinery Cost') - getVal('Less: Accumulated Depreciation') + getVal('Breeding Livestock') + getVal('Orchards/Plantations');
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = getVal('Accounts Payable') + getVal('Short-term Loans') + getVal('Accrued Expenses') + getVal('Taxes Payable');
    const totalNonCurrentLiabilities = getVal('Long-term Loan') + getVal('Equipment Finance Lease');
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    const totalEquity = getVal('Owner Capital') + getVal('Retained Earnings') + getVal('Current Year Profit/Loss') - getVal('Drawings (Minus)');

    const liabEquityCheck = totalLiabilities + totalEquity;
    const difference = totalAssets - liabEquityCheck;

    const renderInput = (label: string) => (
        <div className="input-group" key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</label>
            <input
                type="number"
                step="0.01"
                value={accountMap[label] === undefined ? '' : accountMap[label]}
                onChange={(e) => handleValueChange(label, e.target.value)}
                placeholder="0.00"
                style={{
                    width: '120px',
                    textAlign: 'right',
                    padding: '0.4rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)'
                }}
            />
        </div>
    );

    const renderTotal = (label: string, value: number, isFinal = false) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderTop: '1px solid var(--glass-border)',
            marginTop: '0.5rem',
            fontWeight: 700,
            color: isFinal ? 'var(--accent-primary)' : 'var(--text-primary)',
            background: isFinal ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
            paddingLeft: isFinal ? '0.5rem' : '0',
            paddingRight: isFinal ? '0.5rem' : '0',
            borderRadius: isFinal ? '4px' : '0'
        }}>
            <span>{label}</span>
            <span>Kshs {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
    );

    return (
        <div className="balance-sheet">
            <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3>Farm Balance Sheet</h3>
                    <p className="subtitle">Standard agricultural statement of financial position.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="button-secondary" onClick={loadData} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button className="button-primary" onClick={handleSave} disabled={saving}>
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h4 style={{ margin: 0 }}>Chart of Accounts</h4>
                        <p className="subtitle" style={{ margin: '0.25rem 0 0' }}>Add, update, or remove balance sheet accounts directly.</p>
                    </div>
                    <button className="button-secondary" onClick={handleAddRow}>
                        <Plus size={16} /> Add Account
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Account Name</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Amount</th>
                                <th style={{ width: '80px', textAlign: 'center', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                                        No chart of accounts entries yet. Add a new account to begin.
                                    </td>
                                </tr>
                            ) : (
                                rows.map(row => (
                                    <tr key={row.key}>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={row.account_name}
                                                onChange={(e) => handleRowChange(row.key, 'account_name', e.target.value)}
                                                placeholder="e.g. Cash at Bank"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.65rem',
                                                    border: duplicateAccountNames.includes(row.account_name.trim()) ? '1px solid var(--accent-danger)' : '1px solid var(--glass-border)',
                                                    borderRadius: '6px',
                                                    background: 'var(--bg-input)',
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={row.amount}
                                                onChange={(e) => handleRowChange(row.key, 'amount', e.target.value)}
                                                placeholder="0.00"
                                                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--glass-border)', borderRadius: '6px', background: 'var(--bg-input)', textAlign: 'right' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <button className="btn-icon danger" onClick={() => handleDeleteRow(row.key)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {hasDuplicateNames && (
                    <div style={{ marginTop: '1rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                        Duplicate account names detected: {duplicateAccountNames.join(', ')}. Please use unique account names.
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column: Assets */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                        <TrendingUp size={20} /> ASSETS
                    </h4>

                    <h5 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Current Assets</h5>
                    {['Cash at Bank', 'Accounts Receivable', 'Inventory - Crops', 'Inventory - Livestock Feed', 'Produced Goods Stock', 'Prepaid Expenses'].map(renderInput)}
                    {renderTotal('Total Current Assets', totalCurrentAssets)}

                    <h5 style={{ margin: '2rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Non-Current Assets</h5>
                    {['Land', 'Buildings', 'Farm Machinery Cost', 'Less: Accumulated Depreciation', 'Breeding Livestock', 'Orchards/Plantations'].map(renderInput)}
                    {renderTotal('Total Non-Current Assets', totalNonCurrentAssets)}

                    <div style={{ marginTop: '2rem' }}>
                        {renderTotal('TOTAL ASSETS', totalAssets, true)}
                    </div>

                    <div style={{ marginTop: '3rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                            <span>Balance Check (vs Assets)</span>
                            <span>{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: difference === 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                            <span>Difference (Should be 0)</span>
                            <span>{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Liabilities & Equity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', borderBottom: '2px solid var(--accent-danger)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                            <TrendingDown size={20} /> LIABILITIES
                        </h4>

                        <h5 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Current Liabilities</h5>
                        {['Accounts Payable', 'Short-term Loans', 'Accrued Expenses', 'Taxes Payable'].map(renderInput)}
                        {renderTotal('Total Current Liabilities', totalCurrentLiabilities)}

                        <h5 style={{ margin: '2rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Non-Current Liabilities</h5>
                        {['Long-term Loan', 'Equipment Finance Lease'].map(renderInput)}
                        {renderTotal('Total Non-Current Liabilities', totalNonCurrentLiabilities)}

                        <div style={{ marginTop: '1rem' }}>
                            {renderTotal('TOTAL LIABILITIES', totalLiabilities, true)}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', borderBottom: '2px solid var(--accent-secondary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                            <Landmark size={20} /> EQUITY
                        </h4>

                        {['Owner Capital', 'Retained Earnings', 'Current Year Profit/Loss', 'Drawings (Minus)'].map(renderInput)}

                        <div style={{ marginTop: '1rem' }}>
                            {renderTotal('TOTAL EQUITY', totalEquity, true)}
                        </div>

                        <div style={{ marginTop: '1rem', borderTop: '2px double var(--glass-border)', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem' }}>
                                <span>LIAB + EQUITY CHECK</span>
                                <span>Kshs {liabEquityCheck.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
