import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';

const RecentlyViewed = () => {
    const [products, setProducts] = useState([]);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecentlyViewed();
        } else {
            const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            setProducts(viewed);
        }
    }, [isAuthenticated]);

    const fetchRecentlyViewed = async () => {
        try {
            const response = await userAPI.getRecentlyViewed();
            // Extract product details from the recentlyViewed array objects
            const viewedProducts = response.data.recentlyViewed
                .map((item) => item.product)
                .filter((product) => product !== null); // Filter out any null products
            setProducts(viewedProducts);
        } catch (error) {
            logger.error('Error fetching recently viewed:', error);
        }
    };

    if (products.length === 0) return null;

    return (
        <div className="recently-viewed" style={{ marginTop: 'var(--spacing-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Recently Viewed</h2>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                }}
            >
                {products.map((product) => (
                    <Link
                        to={`/products/${product._id}`}
                        key={product._id}
                        className="recently-viewed-card"
                        style={{
                            display: 'block',
                            textDecoration: 'none',
                            color: 'inherit',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            overflow: 'hidden',
                            transition: 'transform 0.2s',
                        }}
                    >
                        <div style={{ height: '200px', overflow: 'hidden' }}>
                            <img
                                src={product.images?.[0] || DEFAULT_PRODUCT_IMAGE}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                            />
                        </div>
                        <div style={{ padding: 'var(--spacing-md)' }}>
                            <h4
                                style={{
                                    margin: '0 0 var(--spacing-xs)',
                                    fontSize: '1rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {product.name}
                            </h4>
                            <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                ₹{product.price}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;
