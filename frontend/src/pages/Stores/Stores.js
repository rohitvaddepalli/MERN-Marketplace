import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeAPI } from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    useDocumentTitle('Browse Stores');

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await storeAPI.getStores();
            setStores(response.data.stores || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="container">
                <h1 className="page-title">All Stores</h1>
                <p style={{ marginBottom: 'var(--spacing-xl)' }}>Browse our verified seller stores</p>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="stores-grid">
                        {stores.map((store) => (
                            <Link to={`/stores/${store._id}`} key={store._id} className="store-card">
                                <div className="store-banner">
                                    <img src={store.banner} alt={store.name} onError={(e) => e.target.src = 'https://placehold.co/400x150'} />
                                </div>
                                <div className="store-content">
                                    <img src={store.logo} alt={store.name} className="store-logo" onError={(e) => e.target.src = 'https://placehold.co/80'} />
                                    <h3>{store.name}</h3>
                                    <p className="store-category">{store.category}</p>
                                    <div className="store-stats">
                                        <span className="store-rating">
                                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                            {store.rating || 4.5}
                                        </span>
                                        <span className="store-reviews">({store.reviewCount || 0} reviews)</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stores;
