import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import logger from '../../utils/logger';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshAuth } = useAuth();
    const [error, setError] = useState(null);
    useDocumentTitle('Completing Login...');

    useEffect(() => {
        const handleSocialLogin = async () => {
            // SECURITY: Check URL fragment instead of query params
            // Fragments are not sent to server, reducing exposure
            const hash = location.hash;

            if (hash && hash.includes('authenticated=true')) {
                // Clear the fragment immediately for security
                window.history.replaceState(null, '', window.location.pathname);

                try {
                    // The HTTP-only cookie was set by the server
                    // Just refresh auth state to get user data
                    await refreshAuth();

                    // Redirect to home after successful auth
                    navigate('/', { replace: true });
                } catch (err) {
                    logger.error('Social login error:', err);
                    setError('Failed to complete login. Please try again.');
                    setTimeout(() => navigate('/login', { replace: true }), 2000);
                }
            } else {
                // No valid auth fragment, redirect to login
                navigate('/login', { replace: true });
            }
        };

        handleSocialLogin();
    }, [location.hash, navigate, refreshAuth]);

    if (error) {
        return (
            <div className="loading-page" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh'
            }}>
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="loading-page" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh'
        }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem' }}>Completing login...</p>
        </div>
    );
};

export default LoginSuccess;
