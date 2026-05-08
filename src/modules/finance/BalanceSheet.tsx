import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RefreshCw, TrendingUp, TrendingDown, Landmark, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BalanceEntry {
    account_name: string;
    amount: number;
    updated_at?: string;
}

const BalanceSheet: React.FC = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<BalanceEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await invoke<BalanceEntry[]>('get_balance_sheet_from_ledger');
            setEntries(data);
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

    const exportToCSV = () => {
        if (entries.length === 0) {
            addToast('No data to export', 'warning');
            return;
        }

        const headers = ['Account Name', 'Amount', 'Last Updated'];
        const csvData = entries.map(entry => [
            entry.account_name,
            entry.amount.toFixed(2),
            entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : ''
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `balance_sheet_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('Balance sheet exported successfully', 'success');
    };

    // Group entries by account type
    const groupedEntries = entries.reduce((groups, entry) => {
        // This is a simplified grouping - in a real system you'd get account types from the accounts table
        // For now, we'll group based on common account name patterns
        let type = 'Other';
        const name = entry.account_name.toLowerCase();
        if (name.includes('cash') || name.includes('bank') || name.includes('inventory') || name.includes('equipment')) {
            type = 'Assets';
        } else if (name.includes('loan') || name.includes('payable') || name.includes('liability')) {
            type = 'Liabilities';
        } else if (name.includes('capital') || name.includes('equity') || name.includes('retained')) {
            type = 'Equity';
        }

        if (!groups[type]) groups[type] = [];
        groups[type].push(entry);
        return groups;
    }, {} as Record<string, BalanceEntry[]>);

    const calculateTotal = (entries: BalanceEntry[]) => {
        return entries.reduce((sum, entry) => sum + entry.amount, 0);
    };

    const totalAssets = calculateTotal(groupedEntries['Assets'] || []);
    const totalLiabilities = calculateTotal(groupedEntries['Liabilities'] || []);
    const totalEquity = calculateTotal(groupedEntries['Equity'] || []);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return (
        <div className="balance-sheet">
            <div className="section-header">
                <h2><Landmark size={24} /> Balance Sheet</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={loadData} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        Refresh
                    </button>
                    <button className="btn-secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading balance sheet...</div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <Landmark size={48} />
                    <p>No balance sheet data found</p>
                    <p>Create some journal entries to populate the balance sheet</p>
                </div>
            ) : (
                <div className="balance-sheet-content">
                    <div className="balance-sheet-grid">
                        {/* Assets */}
                        <div className="balance-section assets-section glass">
                            <h3><TrendingUp size={20} /> Assets</h3>
                            <div className="accounts-list">
                                {groupedEntries['Assets']?.map((entry, index) => (
                                    <div key={index} className="account-row">
                                        <span className="account-name">{entry.account_name}</span>
                                        <span className="account-amount">KES {entry.amount.toFixed(2)}</span>
                                    </div>
                                )) || <p className="no-accounts">No asset accounts</p>}
                            </div>
                            <div className="section-total">
                                <strong>Total Assets: KES {totalAssets.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* Liabilities & Equity */}
                        <div className="balance-section liabilities-equity-section glass">
                            <h3><TrendingDown size={20} /> Liabilities & Equity</h3>

                            {/* Liabilities */}
                            <div className="subsection">
                                <h4>Liabilities</h4>
                                <div className="accounts-list">
                                    {groupedEntries['Liabilities']?.map((entry, index) => (
                                        <div key={index} className="account-row">
                                            <span className="account-name">{entry.account_name}</span>
                                            <span className="account-amount">KES {entry.amount.toFixed(2)}</span>
                                        </div>
                                    )) || <p className="no-accounts">No liability accounts</p>}
                                </div>
                                <div className="subsection-total">
                                    Total Liabilities: KES {totalLiabilities.toFixed(2)}
                                </div>
                            </div>

                            {/* Equity */}
                            <div className="subsection">
                                <h4>Equity</h4>
                                <div className="accounts-list">
                                    {groupedEntries['Equity']?.map((entry, index) => (
                                        <div key={index} className="account-row">
                                            <span className="account-name">{entry.account_name}</span>
                                            <span className="account-amount">KES {entry.amount.toFixed(2)}</span>
                                        </div>
                                    )) || <p className="no-accounts">No equity accounts</p>}
                                </div>
                                <div className="subsection-total">
                                    Total Equity: KES {totalEquity.toFixed(2)}
                                </div>
                            </div>

                            <div className="section-total">
                                <strong>Total Liabilities & Equity: KES {totalLiabilitiesAndEquity.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Balance Check */}
                    <div className="balance-check glass">
                        <h3>Balance Check</h3>
                        <div className="balance-comparison">
                            <div className="balance-item">
                                <span>Total Assets:</span>
                                <span className="amount">KES {totalAssets.toFixed(2)}</span>
                            </div>
                            <div className="balance-item">
                                <span>Total Liabilities & Equity:</span>
                                <span className="amount">KES {totalLiabilitiesAndEquity.toFixed(2)}</span>
                            </div>
                            <div className="balance-difference">
                                <span>Difference:</span>
                                <span className={`amount ${Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? 'balanced' : 'unbalanced'}`}>
                                    KES {(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? (
                            <div className="balance-status balanced">
                                ✓ Balance sheet is balanced
                            </div>
                        ) : (
                            <div className="balance-status unbalanced">
                                ⚠ Balance sheet is not balanced - check your journal entries
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheet;
