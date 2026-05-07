import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get extra user data from Firestore (role, etc.)
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            ...userDoc.data()
                        });
                    } else {
                        // Fallback if no firestore doc exists
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'customer' // Default
                        });
                    }
                } catch (error) {
                    logger.error("Error fetching user data:", error);
                    // Still set basic user with default role to prevent redirect loops
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: 'customer' // Default role to prevent undefined
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Login
    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            logger.error('Login error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    };

    // Register
    const register = async (data) => {
        try {
            const { email, password, name, role, phone } = data;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                role: role || 'customer',
                phone: phone || '',
                createdAt: new Date().toISOString(),
                avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            });

            return { success: true, role };
        } catch (error) {
            logger.error('Registration error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    };

    // Google Login
    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    name: user.displayName,
                    email: user.email,
                    role: 'customer',
                    createdAt: new Date().toISOString(),
                    avatar: user.photoURL
                });
            }
            return { success: true };
        } catch (error) {
            logger.error('Google Auth error:', error);
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            logger.error('Logout error:', error);
        }
    };

    const updateUser = (updatedUser) => {
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    const value = useMemo(() => ({
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isSeller: user?.role === 'seller',
        isCustomer: user?.role === 'customer' || !user?.role,
        isAdmin: user?.role === 'admin'
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
