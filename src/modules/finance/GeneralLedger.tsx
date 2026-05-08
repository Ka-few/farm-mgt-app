import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText, Filter, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface LedgerEntry {
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    debit: number;
    credit: number;
    balance: number;
    date: string;
    description: string;
    reference?: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    account_type: string;
    parent_account_id?: string;
    description?: string;
    created_at?: string;
}

const GeneralLedger: React.FC = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        account_id: '',
        start_date: '',
        end_date: ''
    });

    const loadAccounts = async () => {
        try {
            const data = await invoke<Account[]>('get_accounts');
            setAccounts(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load accounts', 'error');
        }
    };

    const loadLedger = async () => {
        setLoading(true);
        try {
            const data = await invoke<LedgerEntry[]>('get_general_ledger', {
                accountId: filters.account_id || null,
                startDate: filters.start_date || null,
                endDate: filters.end_date || null
            });
            setEntries(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load general ledger', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
        loadLedger();
    }, []);

    useEffect(() => {
        loadLedger();
    }, [filters]);

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            account_id: '',
            start_date: '',
            end_date: ''
        });
    };

    const exportToCSV = () => {
        if (entries.length === 0) {
            addToast('No data to export', 'warning');
            return;
        }

        const headers = ['Date', 'Account Code', 'Account Name', 'Description', 'Reference', 'Debit', 'Credit', 'Balance'];
        const csvData = entries.map(entry => [
            entry.date,
            entry.account_code,
            entry.account_name,
            entry.description,
            entry.reference || '',
            entry.debit.toFixed(2),
            entry.credit.toFixed(2),
            entry.balance.toFixed(2)
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `general_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('Ledger exported successfully', 'success');
    };

    const getAccountGroups = () => {
        const groups: { [key: string]: LedgerEntry[] } = {};
        entries.forEach(entry => {
            if (!groups[entry.account_id]) {
                groups[entry.account_id] = [];
            }
            groups[entry.account_id].push(entry);
        });
        return groups;
    };

    const accountGroups = getAccountGroups();

    return (
        <div className="general-ledger">
            <div className="section-header">
                <h2><FileText size={24} /> General Ledger</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section glass">
                <h3><Filter size={18} /> Filters</h3>
                <div className="filters-grid">
                    <div className="form-group">
                        <label>Account</label>
                        <select
                            value={filters.account_id}
                            onChange={(e) => handleFilterChange('account_id', e.target.value)}
                        >
                            <option value="">All Accounts</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button className="btn-secondary" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Ledger Content */}
            <div className="ledger-content">
                {loading ? (
                    <div className="loading">Loading ledger...</div>
                ) : Object.keys(accountGroups).length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No ledger entries found</p>
                        <p>Try adjusting your filters or create some journal entries first</p>
                    </div>
                ) : (
                    <div className="account-ledgers">
                        {Object.entries(accountGroups).map(([accountId, accountEntries]) => {
                            const account = accounts.find(a => a.id === accountId);
                            if (!account) return null;

                            const openingBalance = 0; // Could be calculated from previous periods
                            let runningBalance = openingBalance;

                            return (
                                <div key={accountId} className="account-ledger glass">
                                    <div className="account-header">
                                        <h3>{account.code} - {account.name}</h3>
                                        <span className="account-type">{account.account_type}</span>
                                    </div>

                                    <div className="ledger-table-container">
                                        <table className="ledger-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Description</th>
                                                    <th>Reference</th>
                                                    <th>Debit</th>
                                                    <th>Credit</th>
                                                    <th>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {openingBalance !== 0 && (
                                                    <tr className="opening-balance">
                                                        <td colSpan={5}><em>Opening Balance</em></td>
                                                        <td className={openingBalance >= 0 ? 'positive' : 'negative'}>
                                                            KES {Math.abs(openingBalance).toFixed(2)}
                                                            {openingBalance < 0 && ' (DR)'}
                                                        </td>
                                                    </tr>
                                                )}
                                                {accountEntries.map((entry, index) => {
                                                    // Calculate running balance based on account type
                                                    if (account.account_type === 'Asset' || account.account_type === 'Expense') {
                                                        runningBalance += entry.debit - entry.credit;
                                                    } else if (account.account_type === 'Liability' || account.account_type === 'Equity' || account.account_type === 'Revenue') {
                                                        runningBalance += entry.credit - entry.debit;
                                                    }

                                                    return (
                                                        <tr key={index}>
                                                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                                                            <td>{entry.description}</td>
                                                            <td>{entry.reference || '-'}</td>
                                                            <td className="debit">KES {entry.debit.toFixed(2)}</td>
                                                            <td className="credit">KES {entry.credit.toFixed(2)}</td>
                                                            <td className={`balance ${runningBalance >= 0 ? 'positive' : 'negative'}`}>
                                                                KES {Math.abs(runningBalance).toFixed(2)}
                                                                {runningBalance < 0 && ' (DR)'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="totals-row">
                                                    <td colSpan={3}><strong>Totals:</strong></td>
                                                    <td><strong>KES {accountEntries.reduce((sum, e) => sum + e.debit, 0).toFixed(2)}</strong></td>
                                                    <td><strong>KES {accountEntries.reduce((sum, e) => sum + e.credit, 0).toFixed(2)}</strong></td>
                                                    <td className={`balance ${runningBalance >= 0 ? 'positive' : 'negative'}`}>
                                                        <strong>KES {Math.abs(runningBalance).toFixed(2)}</strong>
                                                        {runningBalance < 0 && ' (DR)'}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralLedger;
