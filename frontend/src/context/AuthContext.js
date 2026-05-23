import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { authAPI, API_URL } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verify session with backend.
    // KEY RULES:
    //  1. If there is no token AND no stored user, skip the API call entirely.
    //  2. On 401: only clear state when there is ALSO no token in localStorage.
    //     A token present means the user just logged in — a transient 401 from
    //     a Render cold-start or race condition must NOT wipe their session.
    //  3. On network/5xx errors: keep existing state — don't log out.
    const checkAuth = useCallback(async (forceCheck = false) => {
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        // No credentials at all AND not forced (e.g. after Google OAuth cookie set)
        // → definitely logged out, no need to hit the server
        if (!token && !storedUser && !forceCheck) {
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.getMe();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            logger.error('Auth check failed:', error);
            const statusCode = error.response?.status;

            // Only hard-logout on 401 when there is no token.
            // If a token IS present, this is a race / cold-start — keep the user.
            if (statusCode === 401 && !token) {
                setUser(null);
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
            }
            // Any other error (network, 5xx) → keep existing state, don't log out
        } finally {
            setLoading(false);
        }
    }, []);

    // On mount: restore user from localStorage immediately (instant UI) then
    // verify with the server in the background.
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (_e) {
                localStorage.removeItem('user');
            }
        }
        checkAuth();
    }, [checkAuth]);

    // Login with email and password
    const login = useCallback(async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const { user: userData, token } = response.data;

            // Persist token for cross-origin deployments (Authorization header fallback)
            if (token) {
                localStorage.setItem('access_token', token);
            }
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true, role: userData.role };
        } catch (error) {
            logger.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    }, []);

    // Register with email and password
    const register = useCallback(async (data) => {
        try {
            const response = await authAPI.register(data);
            const { user: userData, token } = response.data;

            // Persist token for cross-origin deployments (Authorization header fallback)
            if (token) {
                localStorage.setItem('access_token', token);
            }
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true, role: userData.role };
        } catch (error) {
            logger.error('Registration error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    }, []);

    // Login with Google — full-page redirect to backend OAuth handler
    // forceCheck is passed to checkAuth so it hits /me even with no localStorage token
    const refreshAuthForced = useCallback(() => checkAuth(true), [checkAuth]);

    const loginWithGoogle = useCallback(() => {
        window.location.href = `${API_URL}/auth/google`;
    }, []);

    // Logout — always clear local credentials even if server call fails
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            logger.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
        }
    }, []);

    // Update user profile
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            loginWithGoogle,
            logout,
            updateUser,
            refreshAuth: refreshAuthForced,
            isAuthenticated: !!user,
            isSeller: user?.role === 'seller',
            isCustomer: user?.role === 'customer' || !user?.role,
            isAdmin: user?.role === 'admin',
        }),
        [user, loading, login, register, loginWithGoogle, logout, updateUser, refreshAuthForced]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
