import React, { useState } from 'react';
import { FileText, Wallet, Milk, Heart, Sprout, Users } from 'lucide-react';
import FinancialReport from './FinancialReport';
import MilkReport from './MilkReport';
import HealthReport from './HealthReport';
import CropsReport from './CropsReport';
import WorkersReport from './WorkersReport';

const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('financial');

    const tabs = [
        { id: 'financial', label: 'Financial', icon: <Wallet size={18} /> },
        { id: 'milk', label: 'Milk', icon: <Milk size={18} /> },
        { id: 'health', label: 'Health', icon: <Heart size={18} /> },
        { id: 'crops', label: 'Crops', icon: <Sprout size={18} /> },
        { id: 'workers', label: 'Workers', icon: <Users size={18} /> }
    ];

    return (
        <div className="reports-module">
            <div className="tabs-container glass" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)', width: 'fit-content', overflowX: 'auto' }}>
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
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {activeTab === 'financial' && <FinancialReport />}
                {activeTab === 'milk' && <MilkReport />}
                {activeTab === 'health' && <HealthReport />}
                {activeTab === 'crops' && <CropsReport />}
                {activeTab === 'workers' && <WorkersReport />}
            </div>
        </div>
    );
};

export default Reports;
