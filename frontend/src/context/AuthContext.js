import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { authAPI, BASE_API_URL } from '../services/api';

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

    // Fetch current user from backend
    const checkAuth = useCallback(async () => {
        try {
            const response = await authAPI.getMe();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial auth check
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        checkAuth();
    }, [checkAuth]);

    // Login with email and password
    const login = useCallback(async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const userData = response.data.user;

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true, role: userData.role };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    }, []);

    // Register with email and password
    const register = useCallback(async (data) => {
        try {
            const response = await authAPI.register(data);
            const userData = response.data.user;

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true, role: userData.role };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    }, []);

    // Login with Google (Directly to backend)
    const loginWithGoogle = useCallback(() => {
        window.location.href = `${BASE_API_URL}/api/auth/google`;
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
            setUser(null);
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    // Update user profile
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        refreshAuth: checkAuth,
        isAuthenticated: !!user,
        isSeller: user?.role === 'seller',
        isCustomer: user?.role === 'customer',
        isAdmin: user?.role === 'admin'
    }), [user, loading, login, register, loginWithGoogle, logout, updateUser, checkAuth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
