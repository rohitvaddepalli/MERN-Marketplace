import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeAPI, productAPI } from '../../services/api';

const StoreDetail = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStoreAndProducts = useCallback(async () => {
        try {
            const [storeRes, productsRes] = await Promise.all([
                storeAPI.getStore(id),
                productAPI.getProducts({ store: id })
            ]);
            setStore(storeRes.data.store);
            setProducts(productsRes.data.products || []);
        } catch (error) {
            console.error('Error fetching store:', error);
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
                        <Link to="/stores" className="btn btn-primary">Browse Stores</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingTop: 0 }}>
            <div className="store-banner" style={{ height: '300px', marginBottom: '0', borderRadius: '0', position: 'relative', zIndex: 1 }}>
                <img src={store.banner} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0' }} onError={(e) => e.target.src = 'https://placehold.co/1200x300'} />
            </div>
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)', marginTop: '-120px', position: 'relative', zIndex: 10 }}>
                    <img
                        src={store.logo}
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
                            zIndex: 10
                        }}
                        onError={(e) => e.target.src = 'https://placehold.co/200'}
                    />
                    <h1>{store.name}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>{store.description}</p>
                    <span className="badge badge-info">{store.category}</span>
                </div>

                <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Products from this store</h2>
                <div className="products-grid">
                    {products.map((product) => (
                        <Link to={`/products/${product._id}`} key={product._id} className="product-card">
                            <div className="product-image">
                                <img src={product.images?.[0] || 'https://placehold.co/300'} alt={product.name} onError={(e) => e.target.src = 'https://placehold.co/300'} />
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <div className="product-footer">
                                    <span className="current-price">₹{product.price}</span>
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
            </div>
        </div>
    );
};

export default StoreDetail;
