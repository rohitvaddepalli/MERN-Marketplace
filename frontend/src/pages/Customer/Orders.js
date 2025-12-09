import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getMyOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'success';
            case 'shipped': return 'info';
            case 'processing': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'primary';
        }
    };

    return (
        <div className="page-container">
            <div className="container">
                <h1 className="page-title">My Orders</h1>
                <p style={{ marginBottom: 'var(--spacing-xl)' }}>View and track all your orders</p>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>No Orders Yet</h3>
                        <p>You haven't placed any orders</p>
                        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        {orders.map((order) => (
                            <div key={order._id} className="card">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, marginBottom: '4px' }}>Order #{order.orderNumber}</h3>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`badge badge-${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                        {order.items?.map((item, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                                <img
                                                    src={item.image || 'https://placehold.co/80'}
                                                    alt={item.name}
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius)' }}
                                                    onError={(e) => e.target.src = 'https://placehold.co/80'}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, marginBottom: '4px' }}>{item.name}</h4>
                                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </p>
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--primary-color)' }}>
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>Total:</strong> ₹{order.totalPrice?.toFixed(2)}
                                    </div>
                                    <div>
                                        <strong>Payment:</strong> {order.paymentMethod?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;
