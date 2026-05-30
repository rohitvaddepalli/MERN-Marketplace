import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI, userAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import logger from '../../utils/logger';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/images';
import RecentlyViewed from '../../components/Products/RecentlyViewed';

// Lazy-load heavy sub-features so the main product page chunk stays lean.
// ProductReviews: always rendered below the fold — code-split for initial JS savings.
// ChatBox: conditionally shown; only starts downloading when the user opens chat.
const ProductReviews = lazy(() => import('../../components/Products/ProductReviews'));
const ChatBox = lazy(() => import('../../components/Chat/ChatBox'));


const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { user, isAuthenticated, isSeller, isAdmin } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

    useDocumentTitle(product ? product.name : 'Product Details');

    const fetchProduct = useCallback(async () => {
        try {
            const response = await productAPI.getProduct(id);
            setProduct(response.data.product);
        } catch (error) {
            logger.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [id, fetchProduct]);

    useEffect(() => {
        if (product) {
            try {
                // Create a minimized version of the product to save space
                const minimizedProduct = {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    // Only keep the first image and replace large base64 with placeholder
                    images:
                        product.images && product.images.length > 0
                            ? [
                                  product.images[0].length > 5000
                                      ? DEFAULT_PRODUCT_IMAGE
                                      : product.images[0],
                              ]
                            : [],
                    store: product.store
                        ? { _id: product.store._id, name: product.store.name }
                        : null,
                };

                // Save to localStorage
                const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const newViewed = [
                    minimizedProduct,
                    ...viewed.filter((p) => p._id !== product._id),
                ].slice(0, 10);
                localStorage.setItem('recentlyViewed', JSON.stringify(newViewed));
            } catch (error) {
                logger.error('Error saving to recently viewed:', error);
                // If quota exceeded, we might want to clear the list to recover
                if (error.name === 'QuotaExceededError') {
                    localStorage.removeItem('recentlyViewed');
                }
            }

            if (isAuthenticated && id) {
                userAPI
                    .addToRecentlyViewed(id)
                    .catch((err) => logger.error('Error adding to recently viewed:', err));
            }
        }
    }, [product, isAuthenticated, id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
            toast.success('Product added to cart!');
        }
    };

    const handleAddToWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await userAPI.addToWishlist(product._id);
            toast.success('Added to wishlist!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding to wishlist');
        }
    };

    const handleBuyNow = () => {
        if (product) {
            // For both authenticated and guest users, we can just add to cart and redirect to checkout
            // The Checkout page now handles both cases
            addToCart(product, quantity);
            navigate('/checkout');
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="page-container">
                <div className="container">
                    <div className="empty-state">
                        <h3>Product Not Found</h3>
                        <Link to="/products" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="container">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-2xl)',
                        marginTop: 'var(--spacing-xl)',
                    }}
                >
                    <div>
                        <img
                            src={product.images?.[0] || DEFAULT_PRODUCT_IMAGE}
                            alt={product.name}
                            style={{ width: '100%', borderRadius: 'var(--border-radius-lg)' }}
                            onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                        />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>
                            {product.name}
                        </h1>
                        <Link
                            to={`/stores/${product.store?._id}`}
                            style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-lg)',
                                color: 'var(--primary-color)',
                            }}
                        >
                            {product.store?.name}
                        </Link>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-lg)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: 'var(--primary-color)',
                                }}
                            >
                                ₹{product.price}
                                {product.compareAtPrice && (
                                    <span
                                        style={{
                                            fontSize: '1.25rem',
                                            color: 'var(--text-light)',
                                            marginLeft: 'var(--spacing-md)',
                                            textDecoration: 'line-through',
                                        }}
                                    >
                                        ₹{product.compareAtPrice}
                                    </span>
                                )}
                            </div>
                            {product.rating > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        backgroundColor: '#fef3c7',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                                        ★ {product.rating.toFixed(1)}
                                    </span>
                                    <span style={{ color: '#92400e', fontSize: '0.9rem' }}>
                                        ({product.reviewCount} reviews)
                                    </span>
                                </div>
                            )}
                        </div>

                        <p style={{ marginBottom: 'var(--spacing-lg)', lineHeight: '1.8' }}>
                            {product.description}
                        </p>

                        {/* Bulk Discounts */}
                        {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
                            <div
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: '#ecfdf5',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid #a7f3d0',
                                }}
                            >
                                <h4 style={{ margin: '0 0 var(--spacing-sm)', color: '#047857' }}>
                                    Bulk Discounts Available!
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#065f46' }}>
                                    {product.bulkDiscounts.map((discount, index) => (
                                        <li key={index}>
                                            Buy {discount.quantity}+ items to get{' '}
                                            {discount.discountPercentage}% off
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <span className="badge badge-info">In Stock: {product.stock}</span>
                            {product.brand && (
                                <span
                                    className="badge badge-secondary"
                                    style={{ marginLeft: 'var(--spacing-sm)' }}
                                >
                                    Brand: {product.brand}
                                </span>
                            )}
                        </div>

                        {!isSeller && !isAdmin && product.stock > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--spacing-md)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-md)',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="1"
                                            max={product.stock}
                                            value={quantity}
                                            onChange={(e) =>
                                                setQuantity(
                                                    Math.max(
                                                        1,
                                                        Math.min(
                                                            product.stock,
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    )
                                                )
                                            }
                                            style={{ width: '100px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="btn btn-outline btn-lg"
                                        style={{ marginTop: 'auto' }}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="btn btn-primary btn-lg"
                                        style={{ marginTop: 'auto' }}
                                    >
                                        Buy Now
                                    </button>
                                    <button
                                        onClick={handleAddToWishlist}
                                        className="btn btn-outline"
                                        style={{ marginTop: 'auto', padding: '10px' }}
                                        title="Add to Wishlist"
                                    >
                                        ♥
                                    </button>
                                </div>
                            </div>
                        )}

                        {isAuthenticated && product.seller && user?._id !== product.seller?._id && (
                            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="btn btn-outline"
                                    style={{ width: '100%' }}
                                >
                                    💬 Chat with Seller
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
                    <ProductReviews productId={product._id} />
                </Suspense>

                <RecentlyViewed />
            </div>

            {isChatOpen && product.seller && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                    <Suspense fallback={null}>
                        <ChatBox
                            peerId={product.seller._id}
                            peerName={product.store?.name || product.seller.name || 'Seller'}
                            onClose={() => setIsChatOpen(false)}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
