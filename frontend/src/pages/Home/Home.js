import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, storeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredStores, setFeaturedStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'seller') {
                navigate('/seller/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, storesRes] = await Promise.all([
                productAPI.getFeaturedProducts(),
                storeAPI.getStores()
            ]);

            setFeaturedProducts(productsRes.data.products || []);
            setFeaturedStores(storesRes.data.stores?.slice(0, 6) || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* Hero Section - Non-authenticated users (Floating Cards) */}
            {!isAuthenticated && (
                <section className="hero-section">
                    <div className="container">
                        <div className="hero-content">
                            <div className="hero-text">
                                <h1 className="hero-title">
                                    Discover Amazing
                                    <span className="gradient-text"> Products</span>
                                    <br />
                                    From Local Sellers
                                </h1>
                                <p className="hero-description">
                                    Browse thousands of unique products from verified sellers.
                                    Support local businesses and find exactly what you're looking for.
                                </p>
                                <div className="hero-actions">
                                    <Link to="/products" className="btn btn-primary btn-lg">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Explore Products
                                    </Link>
                                    <Link to="/stores" className="btn btn-outline btn-lg">
                                        Browse Stores
                                    </Link>
                                </div>
                            </div>
                            <div className="hero-image">
                                <div className="hero-card hero-card-1">
                                    <img
                                        src="https://placehold.co/250x250/FF6B35/FFFFFF?text=Electronics"
                                        alt="Electronics"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', opacity: '0.9' }}
                                    />
                                </div>
                                <div className="hero-card hero-card-2">
                                    <img
                                        src="https://placehold.co/200x200/F7931E/FFFFFF?text=Fashion"
                                        alt="Fashion"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', opacity: '0.9' }}
                                    />
                                </div>
                                <div className="hero-card hero-card-3">
                                    <img
                                        src="https://placehold.co/220x220/1B4965/FFFFFF?text=Home"
                                        alt="Home"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', opacity: '0.9' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Hero Section - Authenticated users (Scrolling Products) */}
            {isAuthenticated && (
                <section className="hero-section">
                    <div className="container">
                        <div className="hero-content">
                            <div className="hero-text">
                                <h1 className="hero-title">
                                    Welcome Back,
                                    <br />
                                    <span className="gradient-text"> {user?.name || 'Shopper'}</span>
                                </h1>
                                <p className="hero-description">
                                    Check out the latest arrivals and trending products selected just for you.
                                </p>
                                <div className="hero-actions">
                                    <Link to="/products" className="btn btn-primary btn-lg">
                                        Shop Now
                                    </Link>
                                    <Link to="/customer/orders" className="btn btn-outline btn-lg">
                                        My Orders
                                    </Link>
                                </div>
                            </div>

                            <div className="hero-image">
                                <div className="hero-scroll-wrapper">
                                    {/* Column 1 - Scrolls Up */}
                                    <div className="hero-scroll-column scroll-up">
                                        {[...(featuredProducts.length > 0 ? featuredProducts : Array(6).fill(null)), ...(featuredProducts.length > 0 ? featuredProducts : Array(6).fill(null))].map((product, index) => (
                                            <Link to={product ? `/products/${product._id}` : '#'} key={`col1-${index}`} className="hero-scroll-card">
                                                <img
                                                    src={product?.images?.[0] || `https://placehold.co/100x100/FF6B35/FFFFFF?text=Product`}
                                                    alt={product?.name || 'Product'}
                                                    onError={(e) => e.target.src = 'https://placehold.co/100x100/FF6B35/FFFFFF?text=New'}
                                                />
                                                <div className="hero-scroll-info">
                                                    <h4>{product?.name || 'New Arrival'}</h4>
                                                    <p>{product?.store?.name || 'Store'}</p>
                                                    <span className="hero-scroll-price">₹{product?.price || '999'}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Column 2 - Scrolls Down */}
                                    <div className="hero-scroll-column scroll-down">
                                        {[...(featuredProducts.length > 0 ? [...featuredProducts].reverse() : Array(6).fill(null)), ...(featuredProducts.length > 0 ? [...featuredProducts].reverse() : Array(6).fill(null))].map((product, index) => (
                                            <Link to={product ? `/products/${product._id}` : '#'} key={`col2-${index}`} className="hero-scroll-card">
                                                <img
                                                    src={product?.images?.[0] || `https://placehold.co/100x100/F7931E/FFFFFF?text=Trending`}
                                                    alt={product?.name || 'Product'}
                                                    onError={(e) => e.target.src = 'https://placehold.co/100x100/F7931E/FFFFFF?text=Hot'}
                                                />
                                                <div className="hero-scroll-info">
                                                    <h4>{product?.name || 'Trending'}</h4>
                                                    <p>{product?.store?.name || 'Store'}</p>
                                                    <span className="hero-scroll-price">₹{product?.price || '1499'}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products */}
            <section className="featured-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Products</h2>
                        <Link to="/products" className="view-all-link">
                            View All
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {featuredProducts.map((product) => (
                                <Link to={`/products/${product._id}`} key={product._id} className="product-card">
                                    <div className="product-image">
                                        <img
                                            src={product.images?.[0] || 'https://placehold.co/300'}
                                            alt={product.name}
                                            onError={(e) => e.target.src = 'https://placehold.co/300'}
                                        />
                                        {product.compareAtPrice && (
                                            <div className="product-badge">
                                                Sale
                                            </div>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-store">{product.store?.name}</p>
                                        <div className="product-footer">
                                            <div className="product-price">
                                                <span className="current-price">₹{product.price}</span>
                                                {product.compareAtPrice && (
                                                    <span className="old-price">₹{product.compareAtPrice}</span>
                                                )}
                                            </div>
                                            <div className="product-rating">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                </svg>
                                                <span>{product.rating || 4.5}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Stores */}
            <section className="stores-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Top Rated Stores</h2>
                        <Link to="/stores" className="view-all-link">
                            View All
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Link>
                    </div>

                    <div className="stores-grid">
                        {featuredStores.map((store) => (
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
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Start Selling on Marketplace</h2>
                        <p>Join thousands of sellers and grow your business with our platform</p>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Become a Seller
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
