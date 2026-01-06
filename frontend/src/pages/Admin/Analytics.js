import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './Analytics.css';

const Analytics = () => {
    const [period, setPeriod] = useState('30');
    const [salesData, setSalesData] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');

    const fetchAllAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [salesRes, customerRes, productRes] = await Promise.all([
                analyticsAPI.getAdminSalesAnalytics({ period }),
                analyticsAPI.getAdminCustomerAnalytics(),
                analyticsAPI.getAdminProductAnalytics()
            ]);

            setSalesData(salesRes.data.analytics);
            setCustomerData(customerRes.data.analytics);
            setProductData(productRes.data.analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAllAnalytics();
    }, [period, fetchAllAnalytics]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="admin-layout">
                <AdminSidebar />
                <div className="admin-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-content">
                <div className="analytics-header">
                    <div>
                        <h1>Analytics Overview</h1>
                        <p>Monitor platform performance and metrics</p>
                    </div>
                    <div className="period-selector">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="form-select"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="365">Last Year</option>
                        </select>
                    </div>
                </div>

                <div className="analytics-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        Sales & Revenue
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        Customers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                </div>

                <div className="analytics-body">
                    {activeTab === 'sales' && salesData && (
                        <div className="analytics-section fade-in">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>Total Revenue</h3>
                                    <div className="stat-value">{formatCurrency(salesData.totalRevenue)}</div>
                                    <div className="stat-label">In selected period</div>
                                    <div className="stat-trend positive">
                                        <span className="trend-icon">↑</span> Tax & Shipping Inc.
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <h3>Total Orders</h3>
                                    <div className="stat-value">{salesData.totalOrders}</div>
                                    <div className="stat-label">In selected period</div>
                                </div>
                                <div className="stat-card">
                                    <h3>Avg. Order Value</h3>
                                    <div className="stat-value">{formatCurrency(salesData.averageOrderValue)}</div>
                                </div>
                            </div>

                            <div className="chart-container card">
                                <h3>Revenue Trend</h3>
                                <div className="line-chart-container">
                                    {salesData.salesData.length > 0 ? (
                                        (() => {
                                            const data = salesData.salesData;
                                            const height = 300;
                                            const width = 800; // viewBox width
                                            const padding = 20;

                                            const maxRevenue = Math.max(...data.map(d => d.revenue)) || 100;

                                            // Calculate points
                                            const points = data.map((d, i) => {
                                                const x = (i / (data.length - 1 || 1)) * (width - 2 * padding) + padding;
                                                const y = height - padding - (d.revenue / maxRevenue) * (height - 2 * padding);
                                                return { x, y, ...d };
                                            });

                                            // Create path command
                                            const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
                                            const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

                                            return (
                                                <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="gradientArea" x1="0" x2="0" y1="0" y2="1">
                                                            <stop offset="0%" stopColor="var(--primary-color)" />
                                                            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* Area under line */}
                                                    <path d={areaD} className="chart-area" />

                                                    {/* Line */}
                                                    <path d={pathD} className="chart-path" />

                                                    {/* Data points */}
                                                    {points.map((p, i) => (
                                                        <g key={i} className="chart-point-group">
                                                            <circle
                                                                cx={p.x}
                                                                cy={p.y}
                                                                className="chart-dot"
                                                            >
                                                                <title>{`${new Date(p.date).toLocaleDateString()}: ${formatCurrency(p.revenue)}`}</title>
                                                            </circle>
                                                        </g>
                                                    ))}
                                                </svg>
                                            );
                                        })()
                                    ) : (
                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            No data available for selected period
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && customerData && (
                        <div className="analytics-section fade-in">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h3>Total Customers</h3>
                                    <div className="stat-value">{customerData.totalCustomers}</div>
                                </div>
                                <div className="stat-card">
                                    <h3>Repeat Rate</h3>
                                    <div className="stat-value">{customerData.repeatCustomerRate.toFixed(1)}%</div>
                                    <div className="stat-label">Customers with {'>'}1 order</div>
                                </div>
                            </div>

                            <div className="card full-width">
                                <h3>Top Customers by Spend</h3>
                                <div className="table-responsive">
                                    <table className="analytics-table">
                                        <thead>
                                            <tr>
                                                <th>Customer</th>
                                                <th>Email</th>
                                                <th>Orders</th>
                                                <th>Total Spent</th>
                                                <th>Last Active</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerData.topCustomers.map((customer, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="customer-cell">
                                                            <div className="avatar-circle">{customer.name.charAt(0)}</div>
                                                            {customer.name}
                                                        </div>
                                                    </td>
                                                    <td>{customer.email}</td>
                                                    <td>{customer.totalOrders}</td>
                                                    <td>{formatCurrency(customer.totalSpent)}</td>
                                                    <td>{new Date(customer.lastOrderDate).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && productData && (
                        <div className="analytics-section fade-in">
                            <div className="card full-width">
                                <h3>Top Selling Products</h3>
                                <div className="table-responsive">
                                    <table className="analytics-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Price</th>
                                                <th>Units Sold</th>
                                                <th>Revenue</th>
                                                <th>Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productData.topProducts.map((product, index) => (
                                                <tr key={index}>
                                                    <td>{product.name}</td>
                                                    <td><span className="badge badge-info">{product.category}</span></td>
                                                    <td>{formatCurrency(product.price)}</td>
                                                    <td>{product.totalSold}</td>
                                                    <td>{formatCurrency(product.revenue)}</td>
                                                    <td>
                                                        <span className={`badge badge-${product.stock < 10 ? 'danger' : 'success'}`}>
                                                            {product.stock}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card full-width" style={{ marginTop: '2rem' }}>
                                <h3>Category Performance</h3>
                                <div className="category-grid">
                                    {Object.entries(productData.categoryPerformance).map(([category, data], index) => (
                                        <div key={index} className="category-item">
                                            <h4>{category}</h4>
                                            <div className="category-stats">
                                                <div className="cat-stat">
                                                    <span>Revenue</span>
                                                    <strong>{formatCurrency(data.revenue)}</strong>
                                                </div>
                                                <div className="cat-stat">
                                                    <span>Units</span>
                                                    <strong>{data.unitsSold}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
