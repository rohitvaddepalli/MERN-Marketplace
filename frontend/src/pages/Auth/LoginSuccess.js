import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';

const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);

            // Fetch user details
            authAPI.getMe()
                .then(res => {
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    // Force reload to initialize AuthContext with new token/user
                    window.location.href = '/';
                })
                .catch(err => {
                    console.error(err);
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="loading-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem' }}>Logging you in...</p>
        </div>
    );
};

export default LoginSuccess;
