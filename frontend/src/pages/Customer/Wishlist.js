import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    useDocumentTitle('My Wishlist');

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await userAPI.getWishlist();
            setWishlist(response.data.wishlist || []);
        } catch (error) {
            logger.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await userAPI.removeFromWishlist(productId);
            setWishlist(wishlist.filter((item) => item._id !== productId));
            toast.success('Removed from wishlist');
        } catch (error) {
            logger.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        }
    };

    const handleAddToCart = (product) => {
        addToCart(product, 1);
        toast.success('Product added to cart!');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Wishlist</h1>
                    <p>Items you've saved for later</p>
                </div>

                {wishlist.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg
                                width="60"
                                height="60"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h3>Your wishlist is empty</h3>
                        <Link to="/products" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="products-grid">
                        {wishlist.map((product) => (
                            <div key={product._id} className="product-card">
                                <Link to={`/products/${product._id}`} className="product-image">
                                    <img
                                        src={product.images?.[0] || DEFAULT_PRODUCT_IMAGE}
                                        alt={product.name}
                                        onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                                    />
                                </Link>
                                <div className="product-info">
                                    <h3 className="product-name">
                                        <Link to={`/products/${product._id}`}>{product.name}</Link>
                                    </h3>
                                    <div className="product-price">₹{product.price}</div>
                                    <div
                                        className="product-actions"
                                        style={{
                                            marginTop: 'var(--spacing-md)',
                                            display: 'flex',
                                            gap: 'var(--spacing-sm)',
                                        }}
                                    >
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="btn btn-primary"
                                            style={{ flex: 1 }}
                                        >
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFromWishlist(product._id)}
                                            className="btn btn-outline btn-danger"
                                            title="Remove from Wishlist"
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
