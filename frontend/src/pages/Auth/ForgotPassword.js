import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BASE_API_URL } from '../../services/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${BASE_API_URL}/api/auth/forgotpassword`, {
                email
            });

            if (response.data.success) {
                setSubmitted(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    {!submitted ? (
                        <>
                            <div className="forgot-password-header">
                                <h1>Forgot Password?</h1>
                                <p>Enter your email address and we'll send you a link to reset your password.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="forgot-password-form">
                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>

                                <div className="forgot-password-footer">
                                    <Link to="/login" className="back-to-login">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M15 10H5M5 10l4 4M5 10l4-4" />
                                        </svg>
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="success-container">
                            <div className="success-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2>Check Your Email</h2>
                            <p>
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <p className="success-note">
                                If you don't see the email, check your spam folder or try again.
                            </p>
                            <div className="success-actions">
                                <Link to="/login" className="btn btn-primary btn-lg">
                                    Back to Login
                                </Link>
                                <button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setEmail('');
                                    }}
                                    className="btn btn-outline btn-lg"
                                >
                                    Try Another Email
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="forgot-password-help">
                    <p>Need help? <Link to="/contact">Contact Support</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
