import React, { useState } from 'react';
import { Sprout, Shovel, Wheat } from 'lucide-react';
import CropPlanting from './CropPlanting';
import CropWeeding from './CropWeeding';
import CropHarvesting from './CropHarvesting';

const Crops: React.FC = () => {
    const [activeTab, setActiveTab] = useState('planting');

    const tabs = [
        { id: 'planting', label: 'Planting', icon: <Sprout size={18} /> },
        { id: 'weeding', label: 'Weeding', icon: <Shovel size={18} /> },
        { id: 'harvesting', label: 'Harvesting', icon: <Wheat size={18} /> }
    ];

    return (
        <div className="crops-module">
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
                {activeTab === 'planting' && <CropPlanting />}
                {activeTab === 'weeding' && <CropWeeding />}
                {activeTab === 'harvesting' && <CropHarvesting />}
            </div>
        </div>
    );
};

export default Crops;
