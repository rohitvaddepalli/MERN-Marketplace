import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth as useClerkAuth, useSignIn, useSignUp, useClerk } from '@clerk/react';
import { authAPI, setAuthTokenGetter } from '../services/api';
import logger from '../utils/logger';

/**
 * AuthContext — Clerk-backed authentication.
 *
 * Clerk owns credentials (sign-in, sign-up, OAuth, MFA, sessions). This
 * context keeps the exact API the rest of the app already consumes
 * (user / login / register / logout / role flags) and layers the local
 * application profile (role, wishlist, etc.) from the backend on top:
 *
 *   - `user` is the Postgres profile from GET /auth/me, fetched whenever a
 *     Clerk session exists. Clerk's session token is attached to every API
 *     request through setAuthTokenGetter (see services/api.js).
 *   - roles (customer/seller/admin) live in our database, not in Clerk.
 */
const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const {
        isLoaded: clerkLoaded,
        isSignedIn,
        getToken,
    } = useClerkAuth();
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const clerk = useClerk();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Route every backend request through the Clerk session token.
    // (Replaces the old localStorage JWT / cookie juggling.)
    useEffect(() => {
        setAuthTokenGetter(() => getToken());
    }, [getToken]);

    // Fetch the local profile for the signed-in Clerk user
    const refreshAuth = useCallback(async () => {
        if (!isSignedIn) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const response = await authAPI.getMe();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
            }
        } catch (error) {
            logger.error('Auth check failed:', error);
            // 401 means the profile could not be resolved — treat as signed out.
            // Network/5xx errors keep existing state (no cold-start logout).
            if (error.response?.status === 401) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    // Keep local state in sync with Clerk's session state
    useEffect(() => {
        if (!clerkLoaded) return;
        if (!isSignedIn) {
            setUser(null);
            setLoading(false);
            return;
        }
        refreshAuth();
    }, [clerkLoaded, isSignedIn, refreshAuth]);

    // Login with email and password (Clerk password strategy)
    const login = useCallback(
        async (email, password) => {
            if (!signInLoaded) {
                return { success: false, message: 'Authentication is not ready yet' };
            }
            try {
                const result = await signIn.create({
                    identifier: email,
                    password,
                });
                if (result.status === 'complete' && result.createdSessionId) {
                    await clerk.setActive({ session: result.createdSessionId });
                    return { success: true };
                }
                return {
                    success: false,
                    message: 'Additional verification is required to complete sign-in',
                };
            } catch (error) {
                logger.error('Login error:', error);
                const message =
                    error.errors?.[0]?.message ||
                    error.message ||
                    'Login failed';
                return { success: false, message };
            }
        },
        [signIn, signInLoaded, clerk]
    );

    // Register with email and password (Clerk sign-up)
    const register = useCallback(
        async (data) => {
            if (!signUpLoaded) {
                return { success: false, message: 'Authentication is not ready yet' };
            }
            const { name, email, password, role, phone } = data;
            const [firstName, ...rest] = (name || '').trim().split(/\s+/);
            try {
                const result = await signUp.create({
                    firstName: firstName || name || undefined,
                    lastName: rest.join(' ') || undefined,
                    emailAddress: email,
                    password,
                    // The backend reads this when creating the local profile so
                    // seller sign-ups keep their role (admin is never client-set).
                    unsafeMetadata: {
                        role: role === 'seller' ? 'seller' : 'customer',
                        phone: phone || '',
                    },
                });

                if (result.status === 'complete' && result.createdSessionId) {
                    await clerk.setActive({ session: result.createdSessionId });
                    return { success: true, role: role === 'seller' ? 'seller' : 'customer' };
                }
                return {
                    success: false,
                    message:
                        'Account created — check your email to verify your account, then sign in.',
                };
            } catch (error) {
                logger.error('Registration error:', error);
                const message =
                    error.errors?.[0]?.message ||
                    error.message ||
                    'Registration failed';
                return { success: false, message };
            }
        },
        [signUp, signUpLoaded, clerk]
    );

    // Login with Google — Clerk OAuth redirect flow; the callback is handled
    // by <AuthenticateWithRedirectCallback /> at /sso-callback.
    const loginWithGoogle = useCallback(async () => {
        if (!signInLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (error) {
            logger.error('Google sign-in error:', error);
        }
    }, [signIn, signInLoaded]);

    // Logout — clear the Clerk session; local profile state resets via the
    // session-state effect above.
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            logger.error('Logout error:', error);
        }
        try {
            await clerk.signOut();
        } finally {
            setUser(null);
        }
    }, [clerk]);

    // Update user profile (local state only — server is the source of truth)
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
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
            refreshAuth,
            getToken,
            isAuthenticated: !!user,
            isSeller: user?.role === 'seller',
            isCustomer: user?.role === 'customer' || !user?.role,
            isAdmin: user?.role === 'admin',
        }),
        [
            user,
            loading,
            login,
            register,
            loginWithGoogle,
            logout,
            updateUser,
            refreshAuth,
            getToken,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
