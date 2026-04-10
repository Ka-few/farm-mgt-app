import React, { useState } from 'react';
import { ClipboardList, Activity, Heart, Info } from 'lucide-react';
import LivestockRegistration from './LivestockRegistration';
import LivestockProduction from './LivestockProduction';
import LivestockHealth from './LivestockHealth';

const Livestock: React.FC = () => {
    const [activeTab, setActiveTab] = useState('registration');

    const tabs = [
        { id: 'registration', label: 'Registration', icon: <ClipboardList size={18} /> },
        { id: 'production', label: 'Production', icon: <Activity size={18} /> },
        { id: 'health', label: 'Health Records', icon: <Heart size={18} /> }
    ];

    return (
        <div className="livestock-module">
            <div className="tabs-container glass" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
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
                {activeTab === 'registration' && <LivestockRegistration />}
                {activeTab === 'production' && <LivestockProduction />}
                {activeTab === 'health' && <LivestockHealth />}
            </div>

            <div className="info-footer glass" style={{ marginTop: '3rem', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Info size={18} color="var(--accent-secondary)" />
                <p>Register animals first to link production and health records to specific tags. General production can also be recorded for unidentified stock.</p>
            </div>
        </div>
    );
};

export default Livestock;
