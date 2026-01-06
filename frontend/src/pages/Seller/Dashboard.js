import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storeAPI, productAPI, orderAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import '../Customer/Dashboard.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SellerDashboard = () => {
    const { user } = useAuth();
    useDocumentTitle('Seller Dashboard');
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [storeRes, productsRes, ordersRes] = await Promise.all([
                storeAPI.getMyStore().catch(() => ({ data: { store: null } })),
                productAPI.getMyProducts().catch(() => ({ data: { products: [] } })),
                orderAPI.getSellerOrders().catch(() => ({ data: { orders: [] } }))
            ]);

            setStore(storeRes.data.store);
            setProducts(productsRes.data.products || []);
            setOrders(ordersRes.data.orders || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="dashboard-header">
                    <div>
                        <h1>Seller Dashboard</h1>
                        <p>Welcome back, {user?.name}!</p>
                    </div>
                    {!store ? (
                        <Link to="/seller/store" className="btn btn-primary">
                            Create Store
                        </Link>
                    ) : (
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Link to={`/stores/${store._id}`} className="btn btn-secondary" target="_blank">
                                Visit Store
                            </Link>
                            <Link to="/seller/products" className="btn btn-primary">
                                Add Product
                            </Link>
                        </div>
                    )}
                </div>

                {!store ? (
                    <div className="empty-state" style={{ background: 'white', padding: 'var(--spacing-3xl)', borderRadius: 'var(--border-radius-lg)' }}>
                        <div className="empty-state-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>Create Your Store</h3>
                        <p>Get started by creating your store to start selling products</p>
                        <Link to="/seller/store" className="btn btn-primary btn-lg">
                            Create Store Now
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-stats">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B35, #F77F00)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 7H4m16 0v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7m16 0l-1-4H5L4 7" stroke="white" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>{products.length}</h3>
                                    <p>Total Products</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06D6A0, #1B9AAA)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V5m0 14v-3m7-4h-3m-8 0H5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>₹{totalRevenue.toFixed(2)}</h3>
                                    <p>Total Revenue</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="white" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>{pendingOrders}</h3>
                                    <p>Pending Orders</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                            <div className="dashboard-content">
                                <div className="section-header">
                                    <h2>Recent Products</h2>
                                    <Link to="/seller/products" className="view-all-link">
                                        View All
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </Link>
                                </div>
                                {products.slice(0, 5).map((product) => (
                                    <div key={product._id} style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                                        <img src={product.images?.[0] || 'https://via.placeholder.com/60'} alt={product.name} style={{ width: '60px', height: '60px', borderRadius: 'var(--border-radius)', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/60'} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '0.95rem' }}>{product.name}</h4>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stock: {product.stock}</p>
                                        </div>
                                        <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                            ₹{product.price}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="dashboard-content">
                                <div className="section-header">
                                    <h2>Recent Orders</h2>
                                    <Link to="/seller/orders" className="view-all-link">
                                        View All
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </Link>
                                </div>
                                {orders.slice(0, 5).map((order) => (
                                    <div key={order._id} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>#{order.orderNumber}</h4>
                                            <span className={`badge badge-${order.status === 'delivered' ? 'success' : 'warning'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span>{order.items?.length || 0} items</span>
                                            <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
