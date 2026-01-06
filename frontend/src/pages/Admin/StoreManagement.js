import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import './AdminManagement.css';

const StoreManagement = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        isActive: '',
        search: '',
        page: 1,
        limit: 10
    });
    useDocumentTitle('Store Management (Admin)');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0
    });

    const fetchStores = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllStores(filters);
            setStores(response.data.stores);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                total: response.data.total
            });
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await adminAPI.updateStoreStatus(id, { isActive: !currentStatus });
            toast.success(`Store ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            fetchStores();
        } catch (error) {
            console.error('Error updating store status:', error);
            toast.error('Failed to update store status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will delete the store and all its products.')) return;

        try {
            await adminAPI.deleteStore(id);
            toast.success('Store deleted successfully');
            fetchStores();
        } catch (error) {
            console.error('Error deleting store:', error);
            toast.error(error.response?.data?.message || 'Failed to delete store');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <AdminSidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div className="admin-page-header">
                        <h1>Store Management</h1>
                        <p>Monitor and manage all stores in the marketplace</p>
                    </div>

                    <div className="admin-filters-section">
                        <div className="admin-search-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search stores..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="admin-search-input"
                            />
                        </div>

                        <div className="admin-filter-select">
                            <select
                                value={filters.isActive}
                                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
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
                            <span>{pagination.total} stores found</span>
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
                                            <th>Store</th>
                                            <th>Owner</th>
                                            <th>Category</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stores.map((store) => (
                                            <tr key={store._id}>
                                                <td>
                                                    <div className="admin-table-user">
                                                        <img
                                                            src={store.logo || 'https://via.placeholder.com/50'}
                                                            alt={store.name}
                                                            className="admin-table-avatar"
                                                            onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                                                        />
                                                        <span>{store.name}</span>
                                                    </div>
                                                </td>
                                                <td>{store.owner?.name || 'Unknown'}</td>
                                                <td>{store.category}</td>
                                                <td>
                                                    <div className="admin-rating">
                                                        ⭐ {store.rating.toFixed(1)} ({store.reviewCount})
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${store.isActive ? 'success' : 'danger'}`}>
                                                        {store.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{new Date(store.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            onClick={() => handleToggleStatus(store._id, store.isActive)}
                                                            className={`admin-action-btn ${store.isActive ? 'admin-btn-warning' : 'admin-btn-success'}`}
                                                            title={store.isActive ? 'Deactivate store' : 'Activate store'}
                                                        >
                                                            {store.isActive ? (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            ) : (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(store._id)}
                                                            className="admin-action-btn admin-btn-delete"
                                                            title="Delete store"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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

export default StoreManagement;
