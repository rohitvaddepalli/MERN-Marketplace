import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Analytics.css';

const Analytics = () => {
    const [salesData, setSalesData] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [productData, setProductData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [activeTab, setActiveTab] = useState('sales');

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [sales, customers, products, forecast] = await Promise.all([
                analyticsAPI.getSalesAnalytics({ period }),
                analyticsAPI.getCustomerAnalytics(),
                analyticsAPI.getProductAnalytics(),
                analyticsAPI.getInventoryForecast({ days: period })
            ]);

            setSalesData(sales.data.analytics);
            setCustomerData(customers.data.analytics);
            setProductData(products.data.analytics);
            setForecastData(forecast.data.forecast);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [period, fetchAnalytics]);

    const renderSalesChart = () => {
        if (!salesData?.salesData?.length) return null;

        const maxRevenue = Math.max(...salesData.salesData.map(d => d.revenue));

        return (
            <div className="chart-container">
                <div className="chart-bars">
                    {salesData.salesData.map((data, index) => (
                        <div key={index} className="chart-bar-wrapper">
                            <div
                                className="chart-bar"
                                style={{
                                    height: `${(data.revenue / maxRevenue) * 200}px`,
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)'
                                }}
                                title={`₹${data.revenue.toFixed(2)}`}
                            >
                                <span className="chart-value">₹{data.revenue.toFixed(0)}</span>
                            </div>
                            <div className="chart-label">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div>
                            <h1 className="page-title">Analytics Dashboard</h1>
                            <p>Track your sales, customers, and inventory</p>
                        </div>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="form-select"
                            style={{ width: 'auto' }}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>

                    {/* Tabs */}
                    <div className="analytics-tabs">
                        <button
                            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sales')}
                        >
                            📊 Sales
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customers')}
                        >
                            👥 Customers
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                            onClick={() => setActiveTab('products')}
                        >
                            📦 Products
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'forecast' ? 'active' : ''}`}
                            onClick={() => setActiveTab('forecast')}
                        >
                            🔮 Forecast
                        </button>
                    </div>

                    {/* Sales Analytics */}
                    {activeTab === 'sales' && salesData && (
                        <>
                            <div className="analytics-stats">
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06D6A0, #1B9AAA)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3>₹{salesData.totalRevenue.toFixed(2)}</h3>
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
                                        <h3>{salesData.totalOrders}</h3>
                                        <p>Total Orders</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B35, #F77F00)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3>₹{salesData.averageOrderValue.toFixed(2)}</h3>
                                        <p>Avg Order Value</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Sales Trend</h2>
                                {renderSalesChart()}
                            </div>
                        </>
                    )}

                    {/* Customer Analytics */}
                    {activeTab === 'customers' && customerData && (
                        <>
                            <div className="analytics-stats">
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3>{customerData.totalCustomers}</h3>
                                        <p>Total Customers</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3>{customerData.repeatCustomerRate.toFixed(1)}%</h3>
                                        <p>Repeat Customer Rate</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Top Customers</h2>
                                <div className="customer-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Customer</th>
                                                <th>Orders</th>
                                                <th>Total Spent</th>
                                                <th>Last Order</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerData.topCustomers.map((customer, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{customer.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                {customer.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{customer.totalOrders}</td>
                                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                                                        ₹{customer.totalSpent.toFixed(2)}
                                                    </td>
                                                    <td>{new Date(customer.lastOrderDate).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Product Analytics */}
                    {activeTab === 'products' && productData && (
                        <>
                            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <h2>Top Performing Products</h2>
                                <div className="product-performance">
                                    {productData.topProducts.map((product, index) => (
                                        <div key={index} className="performance-item">
                                            <div className="performance-rank">#{index + 1}</div>
                                            <div className="performance-details">
                                                <h4>{product.name}</h4>
                                                <p>{product.category}</p>
                                            </div>
                                            <div className="performance-stats">
                                                <div className="stat">
                                                    <span className="stat-label">Sold</span>
                                                    <span className="stat-value">{product.totalSold}</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-label">Revenue</span>
                                                    <span className="stat-value">₹{product.revenue.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card">
                                <h2>Category Performance</h2>
                                <div className="category-grid">
                                    {Object.entries(productData.categoryPerformance).map(([category, data]) => (
                                        <div key={category} className="category-card">
                                            <h3>{category}</h3>
                                            <div className="category-stats">
                                                <div>
                                                    <span className="label">Revenue</span>
                                                    <span className="value">₹{data.revenue.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="label">Units Sold</span>
                                                    <span className="value">{data.unitsSold}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Inventory Forecast */}
                    {activeTab === 'forecast' && forecastData && (
                        <div className="card">
                            <h2>Inventory Forecast</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Based on sales velocity over the last {period} days
                            </p>
                            <div className="forecast-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Current Stock</th>
                                            <th>Avg Daily Sales</th>
                                            <th>Days Until Stockout</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {forecastData.filter(p => p.reorderRecommended).map((product, index) => (
                                            <tr key={index}>
                                                <td style={{ fontWeight: '600' }}>{product.name}</td>
                                                <td>{product.currentStock}</td>
                                                <td>{product.averageDailySales.toFixed(2)}</td>
                                                <td>
                                                    <span className={product.daysUntilStockout < 7 ? 'urgent' : 'warning'}>
                                                        {product.daysUntilStockout > 0 ? `${product.daysUntilStockout} days` : 'Out of stock'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-warning">Reorder Recommended</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
