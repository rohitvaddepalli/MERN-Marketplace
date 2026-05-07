import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';
import './Dashboard.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import logger from '../../utils/logger';

const CustomerDashboard = () => {
    const { user } = useAuth();
    useDocumentTitle('Customer Dashboard');
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
            logger.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const recentOrders = orders.slice(0, 5);

    return (
        <div className="page-container">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome back, {user?.name}!</h1>
                        <p>Manage your orders and account settings</p>
                    </div>
                    <Link to="/products" className="btn btn-primary">
                        Browse Products
                    </Link>
                </div>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B35, #F77F00)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h3>{orders.length}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06D6A0, #1B9AAA)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
                            <p>Delivered</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h3>{orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <div className="recent-orders">
                        <div className="section-header">
                            <h2>Recent Orders</h2>
                            <Link to="/customer/orders" className="view-all-link">
                                View All
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <h3>No Orders Yet</h3>
                                <p>Start shopping to see your orders here</p>
                                <Link to="/products" className="btn btn-primary">
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="orders-table">
                                {recentOrders.map((order) => (
                                    <div key={order._id} className="order-row">
                                        <div className="order-info">
                                            <h4>#{order.orderNumber}</h4>
                                            <span className="order-date">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="order-items">
                                            {order.items?.length || 0} items
                                        </div>
                                        <div className="order-total">
                                            ₹{order.totalPrice?.toFixed(2)}
                                        </div>
                                        <div className="order-status">
                                            <span className={`badge badge-${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
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

export default CustomerDashboard;
