import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeAPI } from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import logger from '../../utils/logger';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../constants/images';

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
            logger.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="container">
                <h1 className="page-title">All Stores</h1>
                <p style={{ marginBottom: 'var(--spacing-xl)' }}>
                    Browse our verified seller stores
                </p>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="stores-grid">
                        {stores.map((store) => (
                            <Link
                                to={`/stores/${store._id}`}
                                key={store._id}
                                className="store-card"
                            >
                                <div className="store-banner">
                                    <img
                                        src={store.banner || DEFAULT_STORE_BANNER}
                                        alt={store.name}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => (e.target.src = DEFAULT_STORE_BANNER)}
                                    />
                                </div>
                                <div className="store-content">
                                    <img
                                        src={store.logo || DEFAULT_STORE_LOGO}
                                        alt={store.name}
                                        className="store-logo"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => (e.target.src = DEFAULT_STORE_LOGO)}
                                    />
                                    <h3>{store.name}</h3>
                                    <p className="store-category">{store.category}</p>
                                    <div className="store-stats">
                                        <span className="store-rating">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                            {store.rating || 4.5}
                                        </span>
                                        <span className="store-reviews">
                                            ({store.reviewCount || 0} reviews)
                                        </span>
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
