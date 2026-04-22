import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Sprout,
    Users,
    Milk,
    Droplets,
    Wallet,
    Settings,
    Menu,
    Clock,
    FileText,
    Contact2
} from 'lucide-react';
import '../styles/Shell.css';
import AIChat from './AIChat';

interface ShellProps {
    children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ children }) => {
    return (
        <div className="shell-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">🌿</div>
                    <span className="logo-text">ShambaSmart FARM</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/crops" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Sprout size={20} />
                        <span>Crops</span>
                    </NavLink>

                    <NavLink to="/livestock" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Milk size={20} />
                        <span>Livestock</span>
                    </NavLink>

                    <NavLink to="/irrigation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Droplets size={20} />
                        <span>Irrigation</span>
                    </NavLink>

                    <NavLink to="/workers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Workers</span>
                    </NavLink>

                    <NavLink to="/workers/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Clock size={20} />
                        <span>Attendance</span>
                    </NavLink>

                    <NavLink to="/finance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Wallet size={20} />
                        <span>Finance</span>
                    </NavLink>

                    <NavLink to="/crm" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Contact2 size={20} />
                        <span>CRM</span>
                    </NavLink>

                    <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Reports</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/settings" className="nav-item">
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="mobile-menu-btn">
                            <Menu size={20} />
                        </button>
                        <h1 className="page-title">Management</h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="farm-status">
                            <span className="status-dot online"></span>
                            Offline Ready
                        </div>
                    </div>
                </header>
                <section className="scroll-content">
                    {children}
                </section>
            </main>

            <AIChat />
        </div>
    );
};

export default Shell;
