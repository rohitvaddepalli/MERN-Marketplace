import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, settingsAPI } from '../../services/api';
import './Checkout.css';

const Checkout = () => {
    const { cartItems, getCartTotal, clearCart, addToCart, calculateItemPrice } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({ taxRate: 8, shippingFee: 10 });
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
        phone: user?.phone || '',
        paymentMethod: 'card'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                street: user.address?.street || prev.street,
                city: user.address?.city || prev.city,
                state: user.address?.state || prev.state,
                zipCode: user.address?.zipCode || prev.zipCode,
                country: user.address?.country || prev.country,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);

    useEffect(() => {
        // Check if user came from "Buy Now" button
        const buyNowData = sessionStorage.getItem('buyNowProduct');
        if (buyNowData) {
            try {
                const { product, quantity } = JSON.parse(buyNowData);
                addToCart(product, quantity);
                // Clear the stored data
                sessionStorage.removeItem('buyNowProduct');
            } catch (err) {
                console.error('Error processing buy now product:', err);
            }
        }
    }, [addToCart]);

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            setSettings(response.data.settings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Use default values if fetch fails
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const subtotal = getCartTotal();
            const shipping = settings.shippingFee;
            const tax = subtotal * (settings.taxRate / 100);
            const total = subtotal + shipping + tax;

            const orderData = {
                items: cartItems.map(item => ({
                    product: item._id,
                    name: item.name,
                    price: calculateItemPrice(item), // Use discounted price
                    quantity: item.quantity,
                    image: item.images?.[0],
                    store: item.store?._id
                })),
                shippingAddress: {
                    name: formData.name,
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                    phone: formData.phone
                },
                paymentMethod: formData.paymentMethod,
                itemsPrice: subtotal,
                shippingPrice: shipping,
                taxPrice: tax,
                totalPrice: total
            };

            if (!user) {
                orderData.guestInfo = {
                    name: formData.name,
                    email: formData.email
                };
            }

            const res = await orderAPI.createOrder(orderData);

            if (!user) {
                // Redirect guest to login page with order details
                navigate('/login', {
                    state: {
                        message: 'Order placed successfully! Please login or create an account to track your order.',
                        orderId: res.data.order._id,
                        email: formData.email
                    }
                });
            } else {
                navigate('/order-success', { state: { order: res.data.order } });
            }

            // Clear cart AFTER navigating to avoid the empty cart redirect in Checkout component
            // We use a small timeout to ensure navigation has started
            setTimeout(() => {
                clearCart();
            }, 100);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // If cart is empty and we are not loading (meaning not in the middle of submission), redirect to cart
    // But we need to be careful not to redirect if we just cleared the cart after success
    if (cartItems.length === 0 && !loading) {
        // We can't easily distinguish between "just cleared" and "empty on load" here without more state.
        // However, if we just navigated away in handleSubmit, this component unmounts.
        // The issue is likely that clearCart() triggers a re-render before navigate() happens.

        // A simple fix is to return null but NOT navigate if we are about to navigate anyway.
        // But since we can't know that for sure, let's just return null if loading is true (which it is during submission).
        // Wait, loading is set to false in finally block.

        // Better approach: Don't redirect here. Let the user see an empty checkout or handle it in useEffect.
        // Or, check if we are currently submitting.
    }

    // Move the redirect logic to useEffect to avoid render-time side effects and race conditions
    React.useEffect(() => {
        if (cartItems.length === 0 && !loading) {
            navigate('/cart');
        }
    }, [cartItems, loading, navigate]);

    if (cartItems.length === 0) return null;

    const subtotal = getCartTotal();
    const shipping = settings.shippingFee;
    const tax = subtotal * (settings.taxRate / 100);
    const total = subtotal + shipping + tax;

    return (
        <div className="page-container">
            <div className="container">
                <h1 className="page-title">Checkout</h1>

                <div className="checkout-layout">
                    <div className="checkout-form">
                        <form onSubmit={handleSubmit}>
                            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h2>Shipping Information</h2>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {!user && (
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Street Address</label>
                                    <input
                                        type="text"
                                        name="street"
                                        className="form-input"
                                        value={formData.street}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            className="form-input"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            className="form-input"
                                            value={formData.zipCode}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            className="form-input"
                                            value={formData.country}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="card">
                                <h2>Payment Method</h2>
                                <div className="payment-methods">
                                    <label className={`payment-option ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={formData.paymentMethod === 'card'}
                                            onChange={handleChange}
                                        />
                                        <div className="payment-content">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                                <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            <span>Credit Card</span>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${formData.paymentMethod === 'paypal' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={formData.paymentMethod === 'paypal'}
                                            onChange={handleChange}
                                        />
                                        <div className="payment-content">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            <span>PayPal</span>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formData.paymentMethod === 'cod'}
                                            onChange={handleChange}
                                        />
                                        <div className="payment-content">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V5m0 14v-3m7-4h-3m-8 0H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            <span>Cash on Delivery</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner"></div>
                                        Processing...
                                    </>
                                ) : (
                                    `Place Order - ₹${total.toFixed(2)}`
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {cartItems.map((item) => (
                                <div key={item._id} className="summary-item">
                                    <img src={item.images?.[0] || 'https://placehold.co/60'} alt={item.name} onError={(e) => e.target.src = 'https://placehold.co/60'} />
                                    <div className="summary-item-details">
                                        <h4>{item.name}</h4>
                                        <span>Qty: {item.quantity}</span>
                                        {calculateItemPrice(item) < item.price && (
                                            <span style={{ fontSize: '0.8rem', color: '#059669', display: 'block' }}>
                                                Bulk Discount Applied
                                            </span>
                                        )}
                                    </div>
                                    <span className="summary-item-price">₹{(calculateItemPrice(item) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>₹{shipping.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax ({settings.taxRate}%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row summary-total">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
