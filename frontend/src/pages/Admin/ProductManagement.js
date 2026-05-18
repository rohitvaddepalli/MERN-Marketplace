import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import './AdminManagement.css';
import logger from '../../utils/logger';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        search: '',
        page: 1,
        limit: 10,
    });
    useDocumentTitle('Product Management (Admin)');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });

    const fetchProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllProducts(filters);
            setProducts(response.data.products);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                total: response.data.total,
            });
        } catch (error) {
            logger.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await adminAPI.deleteProduct(id);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            logger.error('Error deleting product:', error);
            toast.error(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-content-area">
                <div className="container" style={{ padding: 0 }}>
                    <div className="admin-page-header">
                        <h1>Product Management</h1>
                        <p>Oversee all products across the marketplace</p>
                    </div>

                    <div className="admin-filters-section">
                        <div className="admin-search-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="admin-search-input"
                            />
                        </div>

                        <div className="admin-filter-select">
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Categories</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home & Garden">Home & Garden</option>
                                <option value="Sports">Sports</option>
                                <option value="Books">Books</option>
                                <option value="Toys">Toys</option>
                                <option value="Food & Beverages">Food & Beverages</option>
                                <option value="Health & Beauty">Health & Beauty</option>
                            </select>
                        </div>

                        <div className="admin-results-info">
                            <span>{pagination.total} products found</span>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Store</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Rating</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product._id}>
                                                <td>
                                                    <div className="admin-table-user">
                                                        <img
                                                            src={
                                                                product.images?.[0] ||
                                                                'https://via.placeholder.com/50'
                                                            }
                                                            alt={product.name}
                                                            className="admin-table-avatar"
                                                            onError={(e) =>
                                                                (e.target.src =
                                                                    'https://via.placeholder.com/50')
                                                            }
                                                        />
                                                        <span>{product.name}</span>
                                                    </div>
                                                </td>
                                                <td>{product.store?.name || 'Unknown'}</td>
                                                <td>{product.category}</td>
                                                <td className="admin-price">
                                                    ₹{product.price.toFixed(2)}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}
                                                    >
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-rating">
                                                        ⭐ {product.rating?.toFixed(1) || 'N/A'} (
                                                        {product.reviewCount || 0})
                                                    </div>
                                                </td>
                                                <td>
                                                    {new Date(
                                                        product.createdAt
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(product._id)
                                                            }
                                                            className="admin-action-btn admin-btn-delete"
                                                            title="Delete product"
                                                        >
                                                            <svg
                                                                width="18"
                                                                height="18"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                            >
                                                                <path
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="admin-pagination">
                                    <button
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className="admin-pagination-btn"
                                    >
                                        Previous
                                    </button>

                                    <div className="admin-pagination-pages">
                                        {Array.from(
                                            { length: pagination.totalPages },
                                            (_, i) => i + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`admin-pagination-btn ${filters.page === page ? 'active' : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        disabled={filters.page === pagination.totalPages}
                                        className="admin-pagination-btn"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;
