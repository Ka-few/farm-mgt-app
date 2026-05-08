import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BarChart, Filter, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ProfitLoss: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profitLoss, setProfitLoss] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });

    const loadProfitLoss = async () => {
        setLoading(true);
        try {
            const result = await invoke<[number, number, number]>('get_profit_loss_from_ledger', {
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
            });
            setProfitLoss({
                revenue: result[0] || 0,
                expenses: result[1] || 0,
                netProfit: result[2] || 0,
            });
        } catch (err) {
            console.error(err);
            addToast('Failed to load Profit & Loss data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfitLoss();
    }, []);

    const handleFilterChange = (field: 'startDate' | 'endDate', value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        loadProfitLoss();
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '' });
        loadProfitLoss();
    };

    const exportToCSV = () => {
        const headers = ['Metric', 'Amount'];
        const rows = [
            ['Revenue', profitLoss.revenue.toFixed(2)],
            ['Expenses', profitLoss.expenses.toFixed(2)],
            ['Net Profit / Loss', profitLoss.netProfit.toFixed(2)],
        ];

        const csv = [headers, ...rows]
            .map(r => r.map(value => `"${value}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `profit_loss_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('Profit & Loss exported successfully', 'success');
    };

    return (
        <div className="profit-loss">
            <div className="section-header">
                <h2><BarChart size={24} /> Profit & Loss</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={applyFilters} disabled={loading}>
                        <Filter size={18} />
                        Apply
                    </button>
                    <button className="btn-secondary" onClick={clearFilters}>
                        Clear
                    </button>
                    <button className="btn-secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="filters-section glass">
                <div className="filters-grid">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card glass">
                    <div className="stat-header">
                        <span>Revenue</span>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">KES {profitLoss.revenue.toFixed(2)}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-header">
                        <span>Expenses</span>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">KES {profitLoss.expenses.toFixed(2)}</span>
                        <span className="stat-label">Total Expenses</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-header">
                        <span>Net</span>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: profitLoss.netProfit >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                            KES {profitLoss.netProfit.toFixed(2)}
                        </span>
                        <span className="stat-label">Net Profit / Loss</span>
                    </div>
                </div>
            </div>

            <div className="detail-panel glass" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <h3>Profit & Loss Summary</h3>
                <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                    The Profit & Loss statement is generated directly from the journal ledger and Chart of Accounts. Use the date filters above to scope reports to the desired period.
                </p>
            </div>
        </div>
    );
};

export default ProfitLoss;
