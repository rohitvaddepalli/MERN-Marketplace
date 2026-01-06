import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, storeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Home.css';
import RecentlyViewed from '../../components/Products/RecentlyViewed';

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

            {/* Recently Viewed */}
            <div className="container" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <RecentlyViewed />
            </div>

            {/* Footer Section */}
            <footer className="footer-section">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-column">
                            <h3>Marketplace</h3>
                            <p>Your one-stop destination for discovering amazing products from local sellers.</p>
                            <div className="footer-social">
                                <a href="#!" aria-label="Facebook">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a href="#!" aria-label="Twitter">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                </a>
                                <a href="#!" aria-label="Instagram">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div className="footer-column">
                            <h4>Quick Links</h4>
                            <ul className="footer-links">
                                <li><Link to="/products">Products</Link></li>
                                <li><Link to="/stores">Stores</Link></li>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>For Sellers</h4>
                            <ul className="footer-links">
                                <li><Link to="/register">Become a Seller</Link></li>
                                <li><Link to="/seller/dashboard">Seller Dashboard</Link></li>
                                <li><Link to="/help">Help Center</Link></li>
                                <li><Link to="/terms">Terms & Conditions</Link></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>Get Started</h4>
                            <div className="footer-cta-buttons">
                                <Link to="/stores" className="btn btn-outline-light">
                                    Browse Stores
                                </Link>
                                <Link to="/products" className="btn btn-outline-light">
                                    Shop Products
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Become a Seller
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Marketplace. All rights reserved.</p>
                        <div className="footer-bottom-links">
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/cookies">Cookie Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
