import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        const { confirmPassword: _confirmPassword, ...registerData } = formData;
        const result = await register(registerData);

        setLoading(false);

        if (result.success) {
            toast.success('Account created successfully!');
            if (result.role === 'seller') {
                navigate('/seller/dashboard');
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
            toast.error(result.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container register-container">
                <div className="auth-left">
                    <div className="auth-branding">
                        <div className="brand-logo">M</div>
                        <h1>Join Marketplace!</h1>
                        <p>Create your account and start your journey</p>
                    </div>
                    <div className="auth-illustration">
                        <div className="floating-card card-1"></div>
                        <div className="floating-card card-2"></div>
                        <div className="floating-card card-3"></div>
                    </div>
                </div>

                <div className="auth-right">
                    <div className="auth-form-wrapper">
                        <h2>Create New Account</h2>
                        <p className="auth-subtitle">Fill in your details to get started</p>

                        {error && (
                            <div className="auth-error">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4m0 4h.01"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="input-with-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M10 10a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-with-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M3 4h14a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                        <path
                                            d="M1 6l9 6 9-6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <div className="input-with-icon">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path
                                                d="M5 8V6a5 5 0 0110 0v2M3 8h14a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            placeholder="Create password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div className="input-with-icon">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path
                                                d="M5 8V6a5 5 0 0110 0v2M3 8h14a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className="form-input"
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number (Optional)</label>
                                <div className="input-with-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path
                                            d="M3 5a2 2 0 012-2h.5a2 2 0 011.9 1.4l.9 2.7a2 2 0 01-.6 2.2l-.9.8a10 10 0 003.3 3.3l.8-.9a2 2 0 012.2-.6l2.7.9a2 2 0 011.4 1.9v.5a2 2 0 01-2 2h-1A11 11 0 013 6V5z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Account Type</label>
                                <div className="role-selection">
                                    <label
                                        className={`role-option ${formData.role === 'customer' ? 'active' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="customer"
                                            checked={formData.role === 'customer'}
                                            onChange={handleChange}
                                        />
                                        <div className="role-content">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                            <div>
                                                <strong>Customer</strong>
                                                <span>Browse and purchase products</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label
                                        className={`role-option ${formData.role === 'seller' ? 'active' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="seller"
                                            checked={formData.role === 'seller'}
                                            onChange={handleChange}
                                        />
                                        <div className="role-content">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 22V12h6v10"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div>
                                                <strong>Seller</strong>
                                                <span>Create store and sell products</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <p className="auth-switch">
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Login Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
