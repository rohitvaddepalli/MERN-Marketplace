import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, storeAPI } from '../../services/api';
import { seedDatabase, clearDatabase } from '../../utils/seeder';
import { useAuth } from '../../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { SwiperSlide } from 'swiper/react';
import RecentlyViewed from '../../components/Products/RecentlyViewed';
import ImageWithFallback from '../../components/Common/ImageWithFallback';
import { SkeletonGrid } from '../../components/Common/Skeleton';
import logger from '../../utils/logger';
import {
    PLACEHOLDER_ELECTRONICS,
    PLACEHOLDER_FASHION,
    PLACEHOLDER_HOME,
    PLACEHOLDER_SPORTS,
    DEFAULT_PRODUCT_IMAGE,
    DEFAULT_STORE_BANNER,
    DEFAULT_STORE_LOGO,
} from '../../constants/images';
import './Home.css';

// HeroSlider is lazy-loaded so the Swiper core + modules are code-split out of the main bundle
const HeroSlider = lazy(() => import('../../components/HeroSlider/HeroSlider'));

const Home = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [featuredStores, setFeaturedStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasNavigated = useRef(false);
    // SSR-safe initializer: read the preference synchronously so the first paint
    // already respects the user's reduced-motion setting, avoiding a brief flash
    // of animations for users who prefer reduced motion.
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
            const handler = (e) => setPrefersReducedMotion(e.matches);
            mql.addEventListener('change', handler);
            return () => mql.removeEventListener('change', handler);
        }
    }, []);

    useEffect(() => {
        // Redirect sellers and admins to their dashboards (only once and when fully loaded)
        if (isAuthenticated && user?.role && !authLoading && !hasNavigated.current) {
            if (user.role === 'admin') {
                hasNavigated.current = true;
                navigate('/admin/dashboard', { replace: true });
            } else if (user.role === 'seller') {
                hasNavigated.current = true;
                navigate('/seller/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, storesRes] = await Promise.all([
                productAPI.getFeaturedProducts(),
                storeAPI.getStores(),
            ]);

            setFeaturedProducts(productsRes.data.products || []);
            setFeaturedStores(storesRes.data.stores?.slice(0, 6) || []);
        } catch (error) {
            logger.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            <Helmet>
                <title>Marketplace | Discover Amazing Products from Local Sellers</title>
                <meta
                    name="description"
                    content="Browse thousands of unique products from verified sellers. Support local businesses and find exactly what you're looking for on Marketplace."
                />
                <meta property="og:title" content="Marketplace | Discover Amazing Products" />
                <meta
                    property="og:description"
                    content="Browse thousands of unique products from verified sellers. Support local businesses and find exactly what you're looking for."
                />
                <meta property="og:type" content="website" />
            </Helmet>

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
                                    Support local businesses and find exactly what you're looking
                                    for.
                                </p>
                                <div className="hero-actions">
                                    <Link to="/products" className="btn btn-primary btn-lg">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path
                                                d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        Explore Products
                                    </Link>
                                    <Link to="/stores" className="btn btn-outline btn-lg">
                                        Browse Stores
                                    </Link>
                                </div>
                            </div>
                            <div className="hero-image">
                                <Suspense fallback={<div className="hero-swiper" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)' }} />}>
                                    <HeroSlider prefersReducedMotion={prefersReducedMotion} autoplayDelay={2500}>
                                        <SwiperSlide>
                                            <div className="hero-slide-card">
                                                <ImageWithFallback
                                                    src={PLACEHOLDER_ELECTRONICS}
                                                    alt="Electronics"
                                                    className="hero-slide-img"
                                                />
                                                <div className="hero-slide-content">
                                                    <h3>Electronics</h3>
                                                    <p>Latest Gadgets</p>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="hero-slide-card">
                                                <ImageWithFallback
                                                    src={PLACEHOLDER_FASHION}
                                                    alt="Fashion"
                                                    className="hero-slide-img"
                                                />
                                                <div className="hero-slide-content">
                                                    <h3>Fashion</h3>
                                                    <p>Trendy Styles</p>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="hero-slide-card">
                                                <ImageWithFallback
                                                    src={PLACEHOLDER_HOME}
                                                    alt="Home"
                                                    className="hero-slide-img"
                                                />
                                                <div className="hero-slide-content">
                                                    <h3>Home &amp; Living</h3>
                                                    <p>Beautiful Decor</p>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                        <SwiperSlide>
                                            <div className="hero-slide-card">
                                                <ImageWithFallback
                                                    src={PLACEHOLDER_SPORTS}
                                                    alt="Sports"
                                                    className="hero-slide-img"
                                                />
                                                <div className="hero-slide-content">
                                                    <h3>Sports</h3>
                                                    <p>Active Gear</p>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    </HeroSlider>
                                </Suspense>
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
                                    <span className="gradient-text">
                                        {' '}
                                        {user?.name || 'Shopper'}
                                    </span>
                                </h1>
                                <p className="hero-description">
                                    Check out the latest arrivals and trending products selected
                                    just for you.
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
                                <div className="hero-swiper-wrapper">
                                    <Suspense fallback={<div className="hero-swiper" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)' }} />}>
                                        <HeroSlider prefersReducedMotion={prefersReducedMotion} autoplayDelay={3000}>
                                            {featuredProducts.length > 0 ? (
                                                featuredProducts.slice(0, 5).map((product) => (
                                                    <SwiperSlide key={product._id}>
                                                        <Link
                                                            to={`/products/${product._id}`}
                                                            style={{
                                                                display: 'block',
                                                                height: '100%',
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            <div className="hero-slide-card">
                                                                <ImageWithFallback
                                                                    src={product.images?.[0]}
                                                                    fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                                                                    alt={product.name}
                                                                    className="hero-slide-img"
                                                                />
                                                                <div className="hero-slide-content">
                                                                    <h3 className="hero-slide-name">
                                                                        {product.name}
                                                                    </h3>
                                                                    <p className="hero-slide-price">
                                                                        ₹{product.price}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </SwiperSlide>
                                                ))
                                            ) : (
                                                <>
                                                    <SwiperSlide>
                                                        <div className="hero-slide-card">
                                                            <ImageWithFallback
                                                                src={PLACEHOLDER_ELECTRONICS}
                                                                alt="Electronics"
                                                                className="hero-slide-img"
                                                            />
                                                            <div className="hero-slide-content">
                                                                <h3>Electronics</h3>
                                                                <p>Latest Gadgets</p>
                                                            </div>
                                                        </div>
                                                    </SwiperSlide>
                                                    <SwiperSlide>
                                                        <div className="hero-slide-card">
                                                            <ImageWithFallback
                                                                src={PLACEHOLDER_FASHION}
                                                                alt="Fashion"
                                                                className="hero-slide-img"
                                                            />
                                                            <div className="hero-slide-content">
                                                                <h3>Fashion</h3>
                                                                <p>Trendy Styles</p>
                                                            </div>
                                                        </div>
                                                    </SwiperSlide>
                                                </>
                                            )}
                                        </HeroSlider>
                                    </Suspense>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Seed & Clear Database Buttons - DEVELOPMENT ONLY & ADMIN ONLY */}
            {process.env.NODE_ENV === 'development' && user?.role === 'admin' && (
                <div
                    className="container"
                    style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to seed the database?')) {
                                const res = await seedDatabase();
                                alert(res.message);
                                fetchData();
                            }
                        }}
                        className="btn btn-outline"
                    >
                        🌱 Seed Database
                    </button>
                    <button
                        onClick={async () => {
                            if (
                                window.confirm(
                                    'Are you sure you want to DELETE ALL PRODUCTS? This cannot be undone.'
                                )
                            ) {
                                const res = await clearDatabase();
                                alert(res.message);
                                fetchData();
                            }
                        }}
                        className="btn btn-outline"
                        style={{ borderColor: 'red', color: 'red' }}
                    >
                        🗑️ Clear Database
                    </button>
                </div>
            )}

            {/* Featured Products */}
            <section className="featured-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Products</h2>
                        <Link to="/products" className="view-all-link">
                            View All
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M7 4l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <SkeletonGrid items={8} type="product" />
                    ) : (
                        <div className="products-grid">
                            {featuredProducts.map((product) => (
                                <Link
                                    to={`/products/${product._id}`}
                                    key={product._id}
                                    className="product-card"
                                >
                                    <div className="product-image">
                                        <ImageWithFallback
                                            src={product.images?.[0]}
                                            fallbackSrc={DEFAULT_PRODUCT_IMAGE}
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                        {product.compareAtPrice && (
                                            <div className="product-badge">Sale</div>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-store">{product.store?.name}</p>
                                        <div className="product-footer">
                                            <div className="product-price">
                                                <span className="current-price">
                                                    ₹{product.price}
                                                </span>
                                                {product.compareAtPrice && (
                                                    <span className="old-price">
                                                        ₹{product.compareAtPrice}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="product-rating">
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
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
                                <path
                                    d="M7 4l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </Link>
                    </div>

                    <div className="stores-grid">
                        {featuredStores.map((store) => (
                            <Link
                                to={`/stores/${store._id}`}
                                key={store._id}
                                className="store-card"
                            >
                                <div className="store-banner">
                                    <ImageWithFallback
                                        src={store.banner}
                                        fallbackSrc={DEFAULT_STORE_BANNER}
                                        alt={store.name}
                                        loading="lazy"
                                    />
                                </div>
                                <div className="store-content">
                                    <ImageWithFallback
                                        src={store.logo}
                                        fallbackSrc={DEFAULT_STORE_LOGO}
                                        alt={store.name}
                                        className="store-logo"
                                        loading="lazy"
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
                            <p>
                                Your one-stop destination for discovering amazing products from
                                local sellers.
                            </p>
                        </div>

                        <div className="footer-column">
                            <h4>Quick Links</h4>
                            <ul className="footer-links">
                                <li>
                                    <Link to="/products">Products</Link>
                                </li>
                                <li>
                                    <Link to="/stores">Stores</Link>
                                </li>
                                <li>
                                    <Link to="/about">About Us</Link>
                                </li>
                                <li>
                                    <Link to="/contact">Contact</Link>
                                </li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>For Sellers</h4>
                            <ul className="footer-links">
                                <li>
                                    <Link to="/register">Become a Seller</Link>
                                </li>
                                <li>
                                    <Link to="/seller/dashboard">Seller Dashboard</Link>
                                </li>
                                <li>
                                    <Link to="/help">Help Center</Link>
                                </li>
                                <li>
                                    <Link to="/terms">Terms & Conditions</Link>
                                </li>
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
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
