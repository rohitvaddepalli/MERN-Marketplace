import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

export const createTestUser = async (overrides = {}) => {
    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer',
        ...overrides,
    };

    return await User.create(userData);
};

export const generateToken = (userId, role = 'customer') => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const getAuthCookie = (token) => {
    return `access_token=${token}`;
};

export const createTestStore = async (userId, overrides = {}) => {
    const storeData = {
        name: 'Test Store',
        description: 'A test store',
        category: 'Electronics',
        owner: userId,
        isActive: true,
        ...overrides,
    };

    return await Store.create(storeData);
};

export const createTestProduct = async (storeId, sellerId, overrides = {}) => {
    const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        stock: 100,
        category: 'Electronics',
        store: storeId,
        seller: sellerId,
        isActive: true,
        ...overrides,
    };

    return await Product.create(productData);
};

export const createTestOrder = async (customerId, product, overrides = {}) => {
    const orderData = {
        customer: customerId,
        items: [
            {
                product: product._id,
                store: product.store,
                quantity: 2,
                price: product.price,
            },
        ],
        shippingAddress: {
            name: 'Test',
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Test',
        },
        paymentMethod: 'cod',
        itemsPrice: product.price * 2,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: product.price * 2,
        ...overrides,
    };

    return await Order.create(orderData);
};

export const createTestSettings = async () => {
    return await Settings.getSettings();
};
