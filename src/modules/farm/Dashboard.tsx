import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar
} from 'lucide-react';
import '../../styles/Dashboard.css';

const Dashboard: React.FC = () => {
    return (
        <div className="dashboard">
            <div className="welcome-header">
                <div>
                    <h2>Farm Overview</h2>
                    <p className="subtitle">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="date-display">
                    <Calendar size={18} />
                    <span>Feb 10, 2026</span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box primary">
                            <TrendingUp size={24} />
                        </div>
                        <span className="trend positive">+12%</span>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">$1,240.00</span>
                        <span className="stat-label">Income (This Month)</span>
                    </div>
                </div>

                <div className="stat-card glass">
                    <div className="stat-header">
                        <div className="icon-box danger">
                            <TrendingDown size={24} />
                        </div>
                        <span className="trend negative">-5%</span>
                    </div>
                    <div className="stat-body">
                        <span className="stat-value">$450.20</span>
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
                        <span className="stat-value">2,450 L</span>
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
                        <span className="stat-value">85%</span>
                        <span className="stat-label">Crop Health Index</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="content-card glass main-chart-placeholder">
                    <h3>Productivity Trends</h3>
                    <div className="placeholder-chart">
                        {/* Simple visual placeholder */}
                        <div className="chart-bar" style={{ height: '40%' }}></div>
                        <div className="chart-bar" style={{ height: '60%' }}></div>
                        <div className="chart-bar" style={{ height: '55%' }}></div>
                        <div className="chart-bar" style={{ height: '80%' }}></div>
                        <div className="chart-bar" style={{ height: '70%' }}></div>
                        <div className="chart-bar" style={{ height: '90%' }}></div>
                    </div>
                </div>

                <div className="content-card glass recent-tasks">
                    <h3>Upcoming Tasks</h3>
                    <ul className="task-list">
                        <li className="task-item">
                            <div className="task-check"></div>
                            <div className="task-info">
                                <span className="task-name">Irrigate Greenhouse A</span>
                                <span className="task-meta">Today, 2:00 PM</span>
                            </div>
                        </li>
                        <li className="task-item">
                            <div className="task-check"></div>
                            <div className="task-info">
                                <span className="task-name">Vaccinate Dairy Herd B</span>
                                <span className="task-meta">Tomorrow, 9:00 AM</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
