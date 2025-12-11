import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
    // With HTTP-only cookies, we verify auth by calling /me endpoint
    const checkAuth = useCallback(async () => {
        try {
            // Check for legacy localStorage user first for quick UI render
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            // Verify with server (cookie is sent automatically)
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
            localStorage.removeItem('token'); // Clean up legacy token
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const { user, token } = response.data;

            // Store user info (non-sensitive) for quick access
            localStorage.setItem('user', JSON.stringify(user));
            // Keep token in localStorage for backward compatibility with existing code
            // The HTTP-only cookie is the primary auth mechanism now
            if (token) {
                localStorage.setItem('token', token);
            }

            setUser(user);

            return { success: true, role: user.role };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await authAPI.register(data);
            const { user, token } = response.data;

            localStorage.setItem('user', JSON.stringify(user));
            if (token) {
                localStorage.setItem('token', token);
            }

            setUser(user);

            return { success: true, role: user.role };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        try {
            // Call server to clear HTTP-only cookie
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local state and storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    // Refresh auth status (useful after social login)
    const refreshAuth = async () => {
        setLoading(true);
        await checkAuth();
    };

    const value = {
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
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
