import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Users, Plus, ShoppingCart, UserPlus, Phone, MapPin, Mail, Edit2, Trash2, CreditCard } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

interface Order {
    id: string;
    customer_id: string;
    customer_name: string;
    order_date: string;
    total_amount: number;
    status: string;
    payment_status: string;
}

const Customers: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState('directory');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showAddOrder, setShowAddOrder] = useState(false);
    const [showEditOrder, setShowEditOrder] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Form states
    const [customerForm, setCustomerForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    const [orderForm, setOrderForm] = useState({
        customer_id: '',
        total_amount: 0,
        order_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const customerData: Customer[] = await invoke('get_customers');
            const orderData: Order[] = await invoke('get_orders');
            setCustomers(customerData);
            setOrders(orderData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_customer', {
                name: customerForm.name,
                phone: customerForm.phone || null,
                email: customerForm.email || null,
                address: customerForm.address || null,
                notes: customerForm.notes || null
            });
            addToast('Customer added successfully', 'success');
            setShowAddCustomer(false);
            fetchData();
        } catch (error) {
            addToast('Failed to add customer', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke('add_order', {
                customerId: orderForm.customer_id,
                totalAmount: orderForm.total_amount,
                orderDate: orderForm.order_date
            });
            addToast('Order recorded and income logged!', 'success');
            setShowAddOrder(false);
            fetchData();
        } catch (error) {
            addToast('Failed to record order', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;
        setLoading(true);
        try {
            await invoke('update_order', {
                id: editingOrder.id,
                customerId: editingOrder.customer_id,
                totalAmount: editingOrder.total_amount,
                orderDate: editingOrder.order_date,
                status: editingOrder.status,
                paymentStatus: editingOrder.payment_status
            });
            addToast('Order updated successfully', 'success');
            setShowEditOrder(false);
            fetchData();
        } catch (error) {
            addToast('Failed to update order', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await invoke('delete_order', { id });
            addToast('Order deleted', 'success');
            fetchData();
        } catch (error) {
            addToast('Failed to delete order', 'error');
        }
    };

    const handleCompletePayment = async (id: string) => {
        try {
            await invoke('complete_payment', { id });
            addToast('Payment completed!', 'success');
            fetchData();
        } catch (error) {
            addToast('Failed to complete payment', 'error');
        }
    };

    return (
        <div className="crm-module">
            <div className="welcome-header">
                <div>
                    <h2>Customer CRM</h2>
                    <p className="subtitle">Manage relationships and track sales orders.</p>
                </div>
            </div>

            <div className="tabs-container glass" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                <button
                    className={`tab-item ${activeSubTab === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('directory')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeSubTab === 'directory' ? 'var(--accent-primary)' : 'transparent', color: activeSubTab === 'directory' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                >
                    <Users size={18} /> Directory
                </button>
                <button
                    className={`tab-item ${activeSubTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('orders')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeSubTab === 'orders' ? 'var(--accent-primary)' : 'transparent', color: activeSubTab === 'orders' ? 'white' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                >
                    <ShoppingCart size={18} /> Order History
                </button>
            </div>

            {activeSubTab === 'directory' && (
                <div className="directory-view">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn-primary" onClick={() => setShowAddCustomer(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            <UserPlus size={18} /> New Customer
                        </button>
                    </div>

                    <div className="customers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {customers.map(c => (
                            <div key={c.id} className="customer-card glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                                <h3 style={{ margin: '0 0 1rem' }}>{c.name}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
                                    {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {c.phone}</div>}
                                    {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {c.email}</div>}
                                    {c.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {c.address}</div>}
                                </div>
                                {c.notes && <p style={{ marginTop: '1rem', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.6 }}>{c.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSubTab === 'orders' && (
                <div className="orders-view">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn-primary" onClick={() => setShowAddOrder(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            <Plus size={18} /> New Order
                        </button>
                    </div>

                    <div className="table-container glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '1rem' }}>Order Date</th>
                                    <th style={{ padding: '1rem' }}>Customer</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Payment</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>{o.order_date}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{o.customer_name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--success-text)' }}>Kshs {o.total_amount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>{o.status}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: o.payment_status === 'paid' ? 'var(--success-text)' : 'var(--warning-text)' }}>{o.payment_status}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {o.payment_status !== 'paid' && (
                                                    <button className="btn-icon" title="Complete Payment" onClick={() => handleCompletePayment(o.id)} style={{ padding: '0.3rem', borderRadius: '4px', background: 'rgba(0,128,0,0.1)', color: 'green', border: 'none', cursor: 'pointer' }}>
                                                        <CreditCard size={14} />
                                                    </button>
                                                )}
                                                <button className="btn-icon" title="Edit Order" onClick={() => { setEditingOrder(o); setShowEditOrder(true); }} style={{ padding: '0.3rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn-icon danger" title="Delete Order" onClick={() => handleDeleteOrder(o.id)} style={{ padding: '0.3rem', borderRadius: '4px', background: 'rgba(255,0,0,0.1)', color: 'red', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showAddCustomer && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Register New Customer</h3>
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <input placeholder="Full Name" required value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <input placeholder="Phone Number" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <input placeholder="Email Address" type="email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <input placeholder="Address" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <textarea placeholder="Notes" value={customerForm.notes} onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddCustomer(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', color: 'black', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddOrder && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Record Sales Order</h3>
                        <form onSubmit={handleAddOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <select required value={orderForm.customer_id} onChange={e => setOrderForm({ ...orderForm, customer_id: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }}>
                                <option value="">-- Select Customer --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="number" placeholder="Total Order Amount" required value={orderForm.total_amount} onChange={e => setOrderForm({ ...orderForm, total_amount: Number(e.target.value) })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <input type="date" required value={orderForm.order_date} onChange={e => setOrderForm({ ...orderForm, order_date: e.target.value })} style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddOrder(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', color: 'black', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Record Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditOrder && editingOrder && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass" style={{ width: '400px', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h3>Edit Sales Order</h3>
                        <form onSubmit={handleUpdateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Customer</label>
                                <select required value={editingOrder.customer_id} onChange={e => setEditingOrder({ ...editingOrder, customer_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }}>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Amount</label>
                                <input type="number" required value={editingOrder.total_amount} onChange={e => setEditingOrder({ ...editingOrder, total_amount: Number(e.target.value) })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Order Date</label>
                                <input type="date" required value={editingOrder.order_date} onChange={e => setEditingOrder({ ...editingOrder, order_date: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Order Status</label>
                                <select required value={editingOrder.status} onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }}>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Payment Status</label>
                                <select required value={editingOrder.payment_status} onChange={e => setEditingOrder({ ...editingOrder, payment_status: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)', color: 'black', borderRadius: '4px' }}>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowEditOrder(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', color: 'black', borderRadius: '4px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.75rem', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '4px', fontWeight: 600 }}>Update Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
