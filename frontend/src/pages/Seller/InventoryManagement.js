import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import './InventoryManagement.css';

const InventoryManagement = () => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState('');
    useDocumentTitle('Inventory Management');

    useEffect(() => {
        fetchLowStockProducts();
    }, []);

    const fetchLowStockProducts = async () => {
        try {
            const response = await productAPI.getLowStockProducts();
            setLowStockProducts(response.data.products || []);
        } catch (error) {
            console.error('Error fetching low stock products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await productAPI.exportProducts();
            const products = response.data.products;

            // Convert to CSV
            const headers = ['Name', 'Description', 'Price', 'Category', 'Stock', 'Low Stock Threshold'];
            const csvData = products.map(p => [
                p.name,
                p.description,
                p.price,
                p.category,
                p.stock,
                p.lowStockThreshold || 10
            ]);

            const csv = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Products exported successfully!');
        } catch (error) {
            console.error('Error exporting products:', error);
            toast.error('Failed to export products');
        }
    };

    const handleImport = async () => {
        try {
            const lines = importData.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const products = lines.slice(1).map(line => {
                const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.trim().replace(/"/g, ''));
                const product = {};

                headers.forEach((header, index) => {
                    const key = header.toLowerCase().replace(/ /g, '');
                    if (key === 'name') product.name = values[index];
                    else if (key === 'description') product.description = values[index];
                    else if (key === 'price') product.price = parseFloat(values[index]);
                    else if (key === 'category') product.category = values[index];
                    else if (key === 'stock') product.stock = parseInt(values[index]);
                    else if (key === 'lowstockthreshold') product.lowStockThreshold = parseInt(values[index]);
                });

                return product;
            });

            await productAPI.bulkImportProducts({ products });
            toast.success(`Successfully imported ${products.length} products!`);
            setShowImport(false);
            setImportData('');
            fetchLowStockProducts();
        } catch (error) {
            console.error('Error importing products:', error);
            toast.error('Failed to import products. Please check the CSV format.');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div>
                            <h1 className="page-title">Inventory Management</h1>
                            <p>Manage your inventory and stock levels</p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button onClick={() => setShowImport(!showImport)} className="btn btn-secondary">
                                {showImport ? 'Cancel Import' : '📥 Import CSV'}
                            </button>
                            <button onClick={handleExport} className="btn btn-primary">
                                📤 Export CSV
                            </button>
                        </div>
                    </div>

                    {showImport && (
                        <div className="card import-section" style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2>Import Products from CSV</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                Paste your CSV data below. Format: Name, Description, Price, Category, Stock, Low Stock Threshold
                            </p>
                            <textarea
                                className="form-textarea"
                                rows="10"
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                                placeholder="Name,Description,Price,Category,Stock,Low Stock Threshold&#10;&quot;Product 1&quot;,&quot;Description&quot;,99.99,Electronics,50,10"
                                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                            />
                            <button onClick={handleImport} className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                                Import Products
                            </button>
                        </div>
                    )}

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                            <div className="alert-icon">⚠️</div>
                            <div>
                                <h2 style={{ margin: 0 }}>Low Stock Alerts</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                    {lowStockProducts.length} products need restocking
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : lowStockProducts.length === 0 ? (
                            <div className="empty-state">
                                <h3>All Products Well Stocked</h3>
                                <p>No products are currently running low on stock</p>
                            </div>
                        ) : (
                            <div className="low-stock-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Current Stock</th>
                                            <th>Threshold</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockProducts.map((product) => (
                                            <tr key={product._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                        <img
                                                            src={product.images?.[0] || 'https://via.placeholder.com/50'}
                                                            alt={product.name}
                                                            style={{ width: '50px', height: '50px', borderRadius: 'var(--border-radius)', objectFit: 'cover' }}
                                                            onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{product.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                ₹{product.price}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{product.category}</td>
                                                <td>
                                                    <span className={`stock-badge ${product.stock === 0 ? 'out-of-stock' : 'low-stock'}`}>
                                                        {product.stock} units
                                                    </span>
                                                </td>
                                                <td>{product.lowStockThreshold || 10} units</td>
                                                <td>
                                                    {product.stock === 0 ? (
                                                        <span className="badge badge-danger">Out of Stock</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Low Stock</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => window.location.href = '/seller/products'}
                                                    >
                                                        Restock
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryManagement;
