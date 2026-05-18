import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './AdminDashboard.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import logger from '../../utils/logger';

const AdminDashboard = () => {
    const { user } = useAuth();
    useDocumentTitle('Admin Dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getDashboardStats();
            setStats(response.data.stats);
        } catch (error) {
            logger.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
                <AdminSidebar />
                <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                    <div
                        className="container"
                        style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}
                    >
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
            link: '/admin/users',
        },
        {
            title: 'Total Stores',
            value: stats?.totalStores || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
            link: '/admin/stores',
        },
        {
            title: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M20 7H4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-1-4H5L4 7"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #FF6B35, #F77F00)',
            link: '/admin/products',
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
            link: '/admin/orders',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V5m0 14v-3m7-4h-3m-8 0H5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #06D6A0, #1B9AAA)',
            link: null,
        },
        {
            title: 'Customers',
            value: stats?.customerCount || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            link: '/admin/users?role=customer',
        },
        {
            title: 'Sellers',
            value: stats?.sellerCount || 0,
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
            link: '/admin/users?role=seller',
        },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <AdminSidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div className="admin-dashboard-header">
                        <div>
                            <h1>Admin Dashboard</h1>
                            <p>Welcome back, {user?.name}! Monitor and manage your marketplace</p>
                        </div>
                    </div>

                    <div className="admin-stats-grid">
                        {statCards.map((card, index) => (
                            <div key={index} className="admin-stat-card">
                                <div
                                    className="admin-stat-icon"
                                    style={{ background: card.gradient }}
                                >
                                    {card.icon}
                                </div>
                                <div className="admin-stat-content">
                                    <h3>{card.value}</h3>
                                    <p>{card.title}</p>
                                </div>
                                {card.link && (
                                    <Link to={card.link} className="admin-stat-link">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path
                                                d="M7 4l6 6-6 6"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--spacing-xl)',
                            marginTop: 'var(--spacing-xl)',
                        }}
                    >
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Recent Users</h2>
                                <Link to="/admin/users" className="view-all-link">
                                    View All
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M7 4l6 6-6 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </Link>
                            </div>
                            <div className="admin-list">
                                {stats?.recentUsers?.slice(0, 5).map((user) => (
                                    <div key={user._id} className="admin-list-item">
                                        <div className="admin-list-avatar">
                                            <img
                                                src={
                                                    user.avatar ||
                                                    'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                                                        user.name
                                                }
                                                alt={user.name}
                                            />
                                        </div>
                                        <div className="admin-list-info">
                                            <h4>{user.name}</h4>
                                            <p>{user.email}</p>
                                        </div>
                                        <span
                                            className={`badge badge-${user.role === 'seller' ? 'warning' : 'info'}`}
                                        >
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Recent Orders</h2>
                                <Link to="/admin/orders" className="view-all-link">
                                    View All
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M7 4l6 6-6 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </Link>
                            </div>
                            <div className="admin-list">
                                {stats?.recentOrders?.slice(0, 5).map((order) => (
                                    <div key={order._id} className="admin-list-item">
                                        <div className="admin-list-info" style={{ flex: 1 }}>
                                            <h4>#{order.orderNumber}</h4>
                                            <p>{order.customer?.name || 'Unknown'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h4
                                                style={{ color: 'var(--primary-color)', margin: 0 }}
                                            >
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </h4>
                                            <span
                                                className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
