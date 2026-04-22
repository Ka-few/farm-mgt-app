import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileText, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../context/ToastContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const CRMReport: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [custData, orderData] = await Promise.all([
                invoke<any[]>('get_customers'),
                invoke<any[]>('get_orders'),
            ]);
            setCustomers(custData);
            setOrders(orderData);
        } catch (error) {
            console.error('Failed to load CRM report data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sales by Customer
    const salesByCustomer: Record<string, number> = {};
    orders.forEach(o => {
        salesByCustomer[o.customer_name] = (salesByCustomer[o.customer_name] || 0) + o.total_amount;
    });
    const customerSalesData = Object.entries(salesByCustomer)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    // Order Status Breakdown
    const statusMap: Record<string, number> = {};
    orders.forEach(o => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const statusPieData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    const exportPDF = async () => {
        try {
            const jsPDFClass: any = (jsPDF as any).default || jsPDF;
            const doc = new jsPDFClass();

            // Branding
            doc.setFontSize(22);
            doc.setTextColor(16, 185, 129); // Green for CRM
            doc.text('SHAMBASMART', 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(74, 85, 80);
            doc.text('CRM & SALES REPORT', 105, 30, { align: 'center' });

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-KE')}`, 105, 42, { align: 'center' });

            // Summary Info
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Customers: ${customers.length}`, 20, 55);
            doc.text(`Total Orders: ${orders.length}`, 20, 63);
            doc.text(`Total Revenue: Kshs ${orders.reduce((s, o) => s + o.total_amount, 0).toLocaleString()}`, 20, 71);

            autoTable(doc, {
                startY: 80,
                head: [['Customer', 'Order Date', 'Amount (Kshs)', 'Status']],
                body: orders.map(o => [
                    o.customer_name,
                    new Date(o.order_date).toLocaleDateString('en-KE'),
                    o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    o.status
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [16, 185, 129] },
                theme: 'grid'
            });

            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Computer-generated. Saved to Downloads folder.', 105, finalY + 20, { align: 'center' });

            const pdfBytes = doc.output('arraybuffer');
            await invoke('save_pdf', {
                filename: 'CRM_Sales_Report.pdf',
                content: Array.from(new Uint8Array(pdfBytes))
            });
            addToast('CRM Report saved to Downloads!', 'success');
        } catch (err: any) {
            console.error(err);
            addToast('Failed to save report: ' + err.message, 'error');
        }
    };

    return (
        <div className="report-container">
            <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>CRM & Sales Performance</h2>
                <button className="button-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} /> Export PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Customers', value: customers.length, icon: <Users size={20} /> },
                    { label: 'Total Orders', value: orders.length, icon: <ShoppingBag size={20} /> },
                    { label: 'Total Revenue', value: `Kshs ${orders.reduce((s, o) => s + o.total_amount, 0).toLocaleString()}`, icon: <TrendingUp size={20} /> }
                ].map(c => (
                    <div key={c.label} className="stat-card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.label}</span>
                            <span style={{ color: 'var(--accent-primary)' }}>{c.icon}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {loading ? <p>Loading reports...</p> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="card glass" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Top Customers by Revenue</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={customerSalesData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={100} />
                                    <Tooltip formatter={(v: any) => `Kshs ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card glass" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0 }}>Order Status Breakdown</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="table-container">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0 }}>Recent Orders</h3>
                        </div>
                        <table>
                            <thead><tr><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {orders.slice(0, 10).map(o => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                                        <td>{new Date(o.order_date).toLocaleDateString()}</td>
                                        <td>Kshs {o.total_amount.toLocaleString()}</td>
                                        <td><span className={`badge badge-${o.status === 'Completed' ? 'success' : 'info'}`}>{o.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default CRMReport;
