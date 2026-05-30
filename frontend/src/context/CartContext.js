import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { DEFAULT_PRODUCT_IMAGE } from '../constants/images';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    // Ref to hold the debounce timer for localStorage writes
    const saveTimerRef = useRef(null);

    useEffect(() => {
        // Load cart from localStorage
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        // Debounce storage writes so rapid quantity changes (e.g. spinner clicks)
        // don't block the main thread on every update. The cart UI updates instantly
        // via state; only the persistence is delayed.
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                // Create a sanitized copy of the cart to avoid exceeding localStorage quota
                const cartToSave = cartItems.map((item) => {
                    const sanitizedItem = { ...item };

                    // Handle images array
                    if (sanitizedItem.images && Array.isArray(sanitizedItem.images)) {
                        sanitizedItem.images = sanitizedItem.images.map((img) =>
                            typeof img === 'string' && img.length > 1000 ? DEFAULT_PRODUCT_IMAGE : img
                        );
                    }

                    // Handle single image property if it exists
                    if (
                        sanitizedItem.image &&
                        typeof sanitizedItem.image === 'string' &&
                        sanitizedItem.image.length > 1000
                    ) {
                        sanitizedItem.image = DEFAULT_PRODUCT_IMAGE;
                    }

                    return sanitizedItem;
                });

                localStorage.setItem('cart', JSON.stringify(cartToSave));
            } catch (error) {
                logger.error('Error saving cart to localStorage:', error);
                // If quota is exceeded, try saving without images as a fallback
                if (error.name === 'QuotaExceededError') {
                    try {
                        const minimalCart = cartItems.map(({ images: _images, image: _image, ...rest }) => ({
                            ...rest,
                            images: [DEFAULT_PRODUCT_IMAGE],
                        }));
                        localStorage.setItem('cart', JSON.stringify(minimalCart));
                    } catch (retryError) {
                        logger.error('Failed to save minimal cart:', retryError);
                    }
                }
            }
        }, 500); // 500ms debounce — fast enough for UX, slow enough to batch rapid changes

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [cartItems]);


    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item._id === product._id);

            if (existingItem) {
                return prevItems.map((item) =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevItems, { ...product, quantity }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) => (item._id === productId ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const calculateItemPrice = (item) => {
        let price = item.price;
        if (item.bulkDiscounts && item.bulkDiscounts.length > 0) {
            const sortedDiscounts = [...item.bulkDiscounts].sort((a, b) => b.quantity - a.quantity);
            const applicableDiscount = sortedDiscounts.find((d) => item.quantity >= d.quantity);

            if (applicableDiscount) {
                price = price * (1 - applicableDiscount.discountPercentage / 100);
            }
        }
        return price;
    };

    const getCartTotal = () => {
        return cartItems.reduce(
            (total, item) => total + calculateItemPrice(item) * item.quantity,
            0
        );
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        calculateItemPrice,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
