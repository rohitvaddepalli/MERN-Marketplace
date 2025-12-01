import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { isAuthenticated, isSeller, isAdmin } = useAuth();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await productAPI.getProduct(id);
            setProduct(response.data.product);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (product) {
            addToCart(product, quantity);
            alert('Product added to cart!');
        }
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            try {
                // Clear any old data first to free up space
                sessionStorage.removeItem('buyNowProduct');

                // Store only essential product info for after login
                // Avoid storing large image data if it's base64
                const images = product.images?.map(img =>
                    img.length > 1000 ? 'https://placehold.co/150' : img
                ) || [];

                const productData = {
                    product: {
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        images: images,
                        store: product.store?._id ? { _id: product.store._id, name: product.store.name } : null,
                        stock: product.stock,
                        description: product.description ? product.description.substring(0, 100) : '' // Truncate description
                    },
                    quantity: quantity
                };

                sessionStorage.setItem('buyNowProduct', JSON.stringify(productData));
                sessionStorage.setItem('redirectAfterLogin', '/checkout');
                navigate('/login');
            } catch (error) {
                console.error('Storage error:', error);
                // Fallback: just redirect to login without product data
                navigate('/login');
            }
            return;
        }
        if (product) {
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
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2xl)', marginTop: 'var(--spacing-xl)' }}>
                    <div>
                        <img
                            src={product.images?.[0] || 'https://placehold.co/600'}
                            alt={product.name}
                            style={{ width: '100%', borderRadius: 'var(--border-radius-lg)' }}
                            onError={(e) => e.target.src = 'https://placehold.co/600'}
                        />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>{product.name}</h1>
                        <Link to={`/stores/${product.store?._id}`} style={{ display: 'block', marginBottom: 'var(--spacing-lg)', color: 'var(--primary-color)' }}>
                            {product.store?.name}
                        </Link>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: 'var(--spacing-lg)' }}>
                            ₹{product.price}
                            {product.compareAtPrice && (
                                <span style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginLeft: 'var(--spacing-md)', textDecoration: 'line-through' }}>
                                    ₹{product.compareAtPrice}
                                </span>
                            )}
                        </div>
                        <p style={{ marginBottom: 'var(--spacing-lg)', lineHeight: '1.8' }}>{product.description}</p>
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <span className="badge badge-info">In Stock: {product.stock}</span>
                        </div>
                        {!isSeller && !isAdmin && product.stock > 0 && (
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        max={product.stock}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                                        style={{ width: '100px' }}
                                    />
                                </div>
                                <button onClick={handleAddToCart} className="btn btn-outline btn-lg" style={{ marginTop: 'auto' }}>
                                    Add to Cart
                                </button>
                                <button onClick={handleBuyNow} className="btn btn-primary btn-lg" style={{ marginTop: 'auto' }}>
                                    Buy Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
