import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Save, RefreshCw, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BalanceEntry {
    account_name: string;
    amount: number;
    updated_at?: string;
}

const BalanceSheet: React.FC = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await invoke<BalanceEntry[]>('get_balance_sheet');
            const entryMap: Record<string, number> = {};
            data.forEach(e => {
                entryMap[e.account_name] = e.amount;
            });
            setEntries(entryMap);
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

    const handleChange = (account: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setEntries(prev => ({ ...prev, [account]: numValue }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const [account, amount] of Object.entries(entries)) {
                await invoke('update_balance_sheet_entry', { accountName: account, amount });
            }
            addToast('Balance sheet updated successfully', 'success');
        } catch (err) {
            console.error(err);
            addToast('Error saving balance sheet', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Calculation Helpers
    const getVal = (key: string) => entries[key] || 0;

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
                value={entries[label] === undefined ? '' : entries[label]}
                onChange={(e) => handleChange(label, e.target.value)}
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
