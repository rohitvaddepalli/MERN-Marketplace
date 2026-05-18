import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './OrderSuccess.css';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, register } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const order = location.state?.order;

    useEffect(() => {
        if (!order) {
            navigate('/');
        }
    }, [order, navigate]);

    if (!order) return null;

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await register({
                name: order.guestInfo.name,
                email: order.guestInfo.email,
                password,
            });

            if (res.success) {
                navigate('/customer/dashboard');
            } else {
                setError(res.message);
            }
        } catch (_err) {
            setError('Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="order-success-page">
            <div className="container">
                <div className="success-card">
                    <div className="success-icon">
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M22 4L12 14.01l-3-3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h1>Order Placed Successfully!</h1>
                    <p className="order-number">Order #{order.orderNumber}</p>
                    <p className="email-confirmation">
                        We've sent a confirmation email to{' '}
                        <strong>{order.guestInfo?.email || user?.email}</strong>
                    </p>

                    {!user && order.guestInfo && (
                        <div className="guest-account-creation">
                            <h3>Create an account to track your order</h3>
                            <p>
                                Enter a password to create your account instantly using the details
                                from your order.
                            </p>

                            <form onSubmit={handleCreateAccount} className="account-form">
                                {error && <div className="error-message">{error}</div>}
                                <div className="form-group">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        className="form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="actions">
                        <Link to="/products" className="btn btn-outline">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
