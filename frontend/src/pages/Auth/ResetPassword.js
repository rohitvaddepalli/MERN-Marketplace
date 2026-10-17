import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSignIn, useClerk } from '@clerk/react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './ResetPassword.css';

/**
 * Reset password — Clerk custom flow (step 2).
 *
 * Expects a pending Clerk sign-in created by /forgot-password with the
 * `reset_password_email_code` strategy. The user submits the emailed code and
 * a new password; Clerk verifies the code, then replaces the password.
 * (The legacy /reset-password/:token route still works — the token, if any,
 * prefills the code field.)
 */
const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const clerk = useClerk();
    const { signIn, isLoaded } = useSignIn();
    const [formData, setFormData] = useState({
        code: token || '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    useDocumentTitle('Reset Password');

    const { code, password, confirmPassword } = formData;

    // No pending reset flow (direct visit / refresh) — send the user back.
    useEffect(() => {
        if (!isLoaded) return;
        if (!signIn || signIn.status === 'needs_identifier') {
            navigate('/forgot-password', { replace: true });
        }
    }, [isLoaded, signIn, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
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

        if (!code.trim()) {
            setError('Enter the code we emailed you');
            return;
        }

        setLoading(true);

        try {
            // 1. Verify the emailed code (moves the sign-in to needs_new_password)
            const attempt = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: code.trim(),
            });

            if (attempt.status !== 'needs_new_password') {
                setError('Incorrect code — please try again.');
                return;
            }

            // 2. Set the new password
            const result = await attempt.resetPassword({ password });

            if (result.status === 'complete' && result.createdSessionId) {
                await clerk.setActive({ session: result.createdSessionId });
                setSuccess(true);
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 2000);
            }
        } catch (err) {
            setError(
                err.errors?.[0]?.message ||
                    err.message ||
                    'Failed to reset password. Please try again.'
            );
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
                                <p>Enter the code from your email and your new password below.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="reset-password-form">
                                {error && <div className="error-message">{error}</div>}

                                <div className="form-group">
                                    <label htmlFor="code">Reset Code</label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={code}
                                        onChange={handleChange}
                                        placeholder="Enter the code we emailed you"
                                        required
                                        disabled={loading}
                                        autoComplete="one-time-code"
                                    />
                                </div>

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
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
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
                                <svg
                                    width="64"
                                    height="64"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2>Password Reset Successful!</h2>
                            <p>Your password has been successfully reset.</p>
                            <p className="success-note">Signing you in…</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
