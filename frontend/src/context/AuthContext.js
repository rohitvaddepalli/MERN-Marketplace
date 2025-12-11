import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

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

    // Check authentication status on mount
    // SECURITY: With HTTP-only cookies, we verify auth by calling /me endpoint
    // No token is stored in localStorage to prevent XSS attacks
    const checkAuth = useCallback(async () => {
        try {
            // Check for localStorage user first for quick UI render (non-sensitive data only)
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            // Verify with server (HTTP-only cookie is sent automatically via withCredentials)
            const response = await authAPI.getMe();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                // Update localStorage for quick access (non-sensitive data only)
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            // Not authenticated or token expired
            setUser(null);
            localStorage.removeItem('user');
            // SECURITY: Clean up any legacy tokens from previous implementation
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const { user } = response.data;

            // SECURITY: Only store non-sensitive user info for quick access
            // Token is in HTTP-only cookie and NOT accessible to JavaScript
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);

            return { success: true, role: user.role };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    }, []);

    const register = useCallback(async (data) => {
        try {
            const response = await authAPI.register(data);
            const { user } = response.data;

            // SECURITY: Only store non-sensitive user info for quick access
            // Token is in HTTP-only cookie and NOT accessible to JavaScript
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);

            return { success: true, role: user.role };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Call server to clear HTTP-only cookie
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local state and storage
            localStorage.removeItem('user');
            // SECURITY: Clean up any legacy tokens from previous implementation
            localStorage.removeItem('token');
            setUser(null);
        }
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    // Refresh auth status (useful after social login)
    const refreshAuth = useCallback(async () => {
        setLoading(true);
        await checkAuth();
    }, [checkAuth]);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshAuth,
        isAuthenticated: !!user,
        isSeller: user?.role === 'seller',
        isCustomer: user?.role === 'customer',
        isAdmin: user?.role === 'admin'
    }), [user, loading, login, register, logout, updateUser, refreshAuth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
