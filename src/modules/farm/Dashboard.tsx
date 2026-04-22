import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import '../../styles/Dashboard.css';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        income: 0,
        expenses: 0,
        milkWeekly: 0,
        cropCount: 0
    });

    const loadDashboardData = async () => {
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // Income & Expenses (This Month)
            const financeSummary = await invoke<any>('get_finance_summary', { startDate: monthStart });

            // Milk Production (Weekly)
            const milkWeekly = await invoke<number>('get_production_summary', { startDate: weekAgo });

            // Active Crops
            const crops = await invoke<any[]>('get_crops');
            const cropCount = crops.length;

            setStats({
                income: financeSummary.income,
                expenses: financeSummary.expenses,
                milkWeekly,
                cropCount
            });
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="dashboard">
            <div className="welcome-header">
                <div>
                    <h2>Farm Overview</h2>
                    <p className="subtitle">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="date-display">
                    <Calendar size={18} />
                    <span>{formattedDate}</span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box primary">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">Kshs {stats.income.toFixed(2)}</span>
                        <span className="stat-label">Income (This Month)</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box danger">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value" style={{ color: 'var(--accent-danger)' }}>
                            Kshs {stats.expenses.toFixed(2)}
                        </span>
                        <span className="stat-label">Expenses (This Month)</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box secondary">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">{stats.milkWeekly.toFixed(1)} L</span>
                        <span className="stat-label">Milk Production (Weekly)</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box warning">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">{stats.cropCount}</span>
                        <span className="stat-label">Active Plantings</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="content-card glass main-chart-placeholder">
                    <h3>Productivity Trends</h3>
                    <div className="placeholder-chart">
                        <div className="chart-bar" style={{ height: '40%' }}></div>
                        <div className="chart-bar" style={{ height: '60%' }}></div>
                        <div className="chart-bar" style={{ height: '55%' }}></div>
                        <div className="chart-bar" style={{ height: '80%' }}></div>
                        <div className="chart-bar" style={{ height: '70%' }}></div>
                        <div className="chart-bar" style={{ height: '90%' }}></div>
                    </div>
                </div>

                <div className="content-card glass recent-tasks">
                    <h3>Recent Activity</h3>
                    <ul className="task-list">
                        <li className="task-item">
                            <div className="task-info">
                                <span className="task-name">System status: Ready</span>
                                <span className="task-meta">All modules online & synced</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
