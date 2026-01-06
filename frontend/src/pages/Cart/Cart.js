import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { settingsAPI } from '../../services/api';
import './Cart.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartCount, calculateItemPrice } = useCart();
    const navigate = useNavigate();
    useDocumentTitle('Shopping Cart');
    const [settings, setSettings] = useState({ taxRate: 8, shippingFee: 10 });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            setSettings(response.data.settings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Use default values if fetch fails
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="page-container">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M9 2L7.17 4M15 2l1.83 2M9 22v-6M15 22v-6M3 8h18M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l1.5-2m16.5 2l-1.5-2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>Your Cart is Empty</h3>
                        <p>Add some products to get started</p>
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
                <h1 className="page-title">Shopping Cart</h1>
                <p style={{ marginBottom: 'var(--spacing-xl)' }}>{getCartCount()} items in your cart</p>

                <div className="cart-layout">
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item._id} className="cart-item">
                                <img
                                    src={item.images?.[0] || 'https://placehold.co/100'}
                                    alt={item.name}
                                    className="cart-item-image"
                                    onError={(e) => e.target.src = 'https://placehold.co/100'}
                                />
                                <div className="cart-item-details">
                                    <h3>{item.name}</h3>
                                    <p className="cart-item-store">{item.store?.name}</p>
                                    <div className="cart-item-price-container">
                                        {calculateItemPrice(item) < item.price ? (
                                            <>
                                                <span className="cart-item-price original" style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.9rem', marginRight: '8px' }}>
                                                    ₹{item.price}
                                                </span>
                                                <span className="cart-item-price discounted" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                                    ₹{calculateItemPrice(item).toFixed(2)}
                                                </span>
                                                <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px' }}>
                                                    Bulk Discount Applied!
                                                </div>
                                            </>
                                        ) : (
                                            <span className="cart-item-price">₹{item.price}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="cart-item-quantity">
                                    <button
                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                        className="quantity-btn"
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        className="quantity-btn"
                                        disabled={item.quantity >= item.stock}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="cart-item-total">
                                    ₹{(calculateItemPrice(item) * item.quantity).toFixed(2)}
                                </div>
                                <button
                                    onClick={() => {
                                        removeFromCart(item._id);
                                        toast.success(`${item.name} removed from cart`);
                                    }}
                                    className="cart-item-remove"
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M6 4V2a1 1 0 011-1h6a1 1 0 011 1v2m3 0H3m2 0v12a2 2 0 002 2h6a2 2 0 002-2V4m-10 4v8m4-8v8" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>₹{settings.shippingFee.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax ({settings.taxRate}%)</span>
                            <span>₹{(getCartTotal() * (settings.taxRate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>₹{(getCartTotal() + settings.shippingFee + getCartTotal() * (settings.taxRate / 100)).toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                        >
                            Proceed to Checkout
                        </button>
                        <Link
                            to="/products"
                            className="btn btn-ghost"
                            style={{ width: '100%', marginTop: 'var(--spacing-md)', textAlign: 'center' }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
