import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './ResetPassword.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    useDocumentTitle('Reset Password');

    const { password, confirmPassword } = formData;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(token, { password });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="reset-password-card">
                    {!success ? (
                        <>
                            <div className="reset-password-header">
                                <h1>Reset Password</h1>
                                <p>Enter your new password below.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="reset-password-form">
                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="password">New Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={handleChange}
                                        placeholder="Enter new password"
                                        required
                                        disabled={loading}
                                        minLength="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        required
                                        disabled={loading}
                                        minLength="6"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>

                                <div className="reset-password-footer">
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
                            <h2>Password Reset Successful!</h2>
                            <p>
                                Your password has been successfully reset.
                            </p>
                            <p className="success-note">
                                Redirecting you to login page...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
