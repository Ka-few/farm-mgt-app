import React, { useState } from 'react';
import FinanceOverview from './FinanceOverview';
import ProductionStatement from './ProductionStatement';
import FinanceIncome from './FinanceIncome';
import FinanceExpenses from './FinanceExpenses';
import Budgets from './Budgets';
import BalanceSheet from './BalanceSheet';
import { DollarSign, ArrowUpRight, ArrowDownRight, Target, Landmark, TrendingUp } from 'lucide-react';

const Finance: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: <DollarSign size={18} /> },
        { id: 'production', label: 'Production & Income', icon: <TrendingUp size={18} /> },
        { id: 'income', label: 'Income Records', icon: <ArrowUpRight size={18} /> },
        { id: 'expenses', label: 'Expense Records', icon: <ArrowDownRight size={18} /> },
        { id: 'budgets', label: 'Budgeting', icon: <Target size={18} /> },
        { id: 'balance_sheet', label: 'Balance Sheet', icon: <Landmark size={18} /> }
    ];

    return (
        <div className="finance-module">
            <div className="tabs-container glass" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', marginBottom: '2rem', borderRadius: 'var(--radius_md)', width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && <FinanceOverview />}
                {activeTab === 'production' && <ProductionStatement />}
                {activeTab === 'income' && <FinanceIncome />}
                {activeTab === 'expenses' && <FinanceExpenses />}
                {activeTab === 'budgets' && <Budgets />}
                {activeTab === 'balance_sheet' && <BalanceSheet />}
            </div>
        </div>
    );
};

export default Finance;
