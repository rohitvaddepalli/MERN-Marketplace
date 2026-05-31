import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { storeAPI, productAPI } from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import logger from '../../utils/logger';
import {
    DEFAULT_STORE_BANNER,
    DEFAULT_STORE_LOGO,
    DEFAULT_PRODUCT_IMAGE,
} from '../../constants/images';

const StoreDetail = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useDocumentTitle(store ? store.name : 'Store Details');

    const fetchStoreAndProducts = useCallback(async () => {
        try {
            const [storeRes, productsRes] = await Promise.all([
                storeAPI.getStore(id),
                productAPI.getProducts({ store: id }),
            ]);
            setStore(storeRes.data.store);
            setProducts(productsRes.data.products || []);
        } catch (error) {
            logger.error('Error fetching store:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStoreAndProducts();
    }, [id, fetchStoreAndProducts]);

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="page-container">
                <div className="container">
                    <div className="empty-state">
                        <h3>Store Not Found</h3>
                        <Link to="/stores" className="btn btn-primary">
                            Browse Stores
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingTop: 0 }}>
            <Helmet>
                <title>{store.name} | Marketplace Store</title>
                <meta
                    name="description"
                    content={`Shop at ${store.name} on Marketplace. ${store.description ? store.description.slice(0, 130) : 'Browse products from this verified seller.'}`}
                />
                <link rel="canonical" href={`https://market-place01.web.app/stores/${id}`} />
                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${store.name} | Marketplace Store`} />
                <meta
                    property="og:description"
                    content={store.description ? store.description.slice(0, 200) : `Shop at ${store.name} on Marketplace.`}
                />
                <meta property="og:image" content={store.logo || store.banner || ''} />
                <meta property="og:url" content={`https://market-place01.web.app/stores/${id}`} />
                <meta property="og:site_name" content="Marketplace" />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${store.name} | Marketplace`} />
                <meta name="twitter:image" content={store.banner || store.logo || ''} />
                {/* LocalBusiness / Organization Schema JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Store',
                        name: store.name,
                        description: store.description || '',
                        image: store.logo || store.banner || undefined,
                        url: `https://market-place01.web.app/stores/${id}`,
                        ...(store.category && { category: store.category }),
                        ...(store.contact?.telephone && { telephone: store.contact.phone }),
                        ...(store.contact?.email && { email: store.contact.email }),
                        ...(store.businessHours && { openingHours: store.businessHours }),
                        ...(store.address?.city && {
                            address: {
                                '@type': 'PostalAddress',
                                streetAddress: store.address.street || undefined,
                                addressLocality: store.address.city,
                                addressRegion: store.address.state || undefined,
                                postalCode: store.address.zipCode || undefined,
                                addressCountry: store.address.country || 'IN',
                            },
                        }),
                        aggregateRating:
                            store.rating > 0 && store.reviewCount > 0
                                ? {
                                      '@type': 'AggregateRating',
                                      ratingValue: store.rating.toFixed(1),
                                      reviewCount: store.reviewCount,
                                  }
                                : undefined,
                    })}
                </script>
            </Helmet>
            <div
                className="store-banner"
                style={{
                    height: '300px',
                    marginBottom: '0',
                    borderRadius: '0',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <img
                    src={store.banner || DEFAULT_STORE_BANNER}
                    alt={store.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0' }}
                    onError={(e) => (e.target.src = DEFAULT_STORE_BANNER)}
                />
            </div>
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-2xl)',
                        marginTop: '-120px',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    <img
                        src={store.logo || DEFAULT_STORE_LOGO}
                        alt={store.name}
                        style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '50%',
                            border: '8px solid white',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            backgroundColor: 'white',
                            objectFit: 'cover',
                            display: 'block',
                            margin: '0 auto var(--spacing-md) auto',
                            position: 'relative',
                            zIndex: 10,
                        }}
                        onError={(e) => (e.target.src = DEFAULT_STORE_LOGO)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0 }}>{store.name}</h1>
                        {store.isVerified && (
                            <span
                                title="Verified Seller"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: '999px',
                                    letterSpacing: '0.03em',
                                    boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                Verified Seller
                            </span>
                        )}
                    </div>
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            marginTop: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-md)',
                        }}
                    >
                        {store.description}
                    </p>
                    <span className="badge badge-info">{store.category}</span>

                    {/* Store Info Panel — contact, address, hours */}
                    {(store.contact?.email || store.contact?.phone || store.address?.city || store.businessHours) && (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: 'var(--spacing-md)',
                                marginTop: 'var(--spacing-xl)',
                                padding: 'var(--spacing-lg)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--border-radius-lg)',
                                maxWidth: '640px',
                                margin: 'var(--spacing-xl) auto 0',
                            }}
                        >
                            {store.contact?.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    <a href={`tel:${store.contact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{store.contact.phone}</a>
                                </div>
                            )}
                            {store.contact?.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    <a href={`mailto:${store.contact.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{store.contact.email}</a>
                                </div>
                            )}
                            {(store.address?.city || store.address?.state) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    <span>{[store.address.city, store.address.state, store.address.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {store.businessHours && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    <span>{store.businessHours}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Products from this store</h2>
                <div className="products-grid">
                    {products.map((product) => (
                        <Link
                            to={`/products/${product._id}`}
                            key={product._id}
                            className="product-card"
                        >
                            <div className="product-image">
                                <img
                                    src={product.images?.[0] || DEFAULT_PRODUCT_IMAGE}
                                    alt={product.name}
                                    onError={(e) => (e.target.src = DEFAULT_PRODUCT_IMAGE)}
                                />
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-footer">
                                    <span className="current-price">₹{product.price}</span>
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
            </div>
        </div>
    );
};

export default StoreDetail;
