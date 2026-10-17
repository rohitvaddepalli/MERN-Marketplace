/**
 * __tests__/helpers.js — fixtures for the PostgreSQL integration suite.
 *
 * Public API is unchanged from the Mongoose era (createTestUser, generateToken,
 * getAuthCookie, createTestStore, createTestProduct, createTestOrder), so the
 * existing test files keep working. Rows are inserted directly with SQL against
 * the app_test schema that setup.integration.js provisions.
 *
 * Auth note: Clerk issues real session tokens in production. Tests can't do
 * that, so generateToken() just tags the user's uuid and getAuthCookie() puts
 * it in the access_token cookie; the NODE_ENV=test auth resolver in
 * setup.integration.js turns that cookie into the same profile object `protect`
 * builds for a live Clerk session. Role checks still come from the database.
 */
import { randomUUID } from 'crypto';
import { query, isUuid } from '../db/index.js';

export const createTestUser = async (overrides = {}) => {
    const data = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        ...overrides,
    };

    const { rows } = await query(
        `INSERT INTO users (clerk_user_id, name, email, role, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            `test_${randomUUID()}`,
            data.name,
            data.email,
            data.role,
            data.phone ?? null,
        ]
    );

    // Mongoose-era shape: tests read `_id` and `role`.
    return { ...rows[0], _id: rows[0].id };
};

/**
 * Test "token" — really just the user uuid. Kept under the old name so call
 * sites (`generateToken(user._id, 'admin')`) don't change.
 */
export const generateToken = (userId, _role = 'customer') => {
    return String(userId);
};

export const getAuthCookie = (token) => {
    return `access_token=${token}`;
};

export const createTestStore = async (userId, overrides = {}) => {
    const data = {
        name: 'Test Store',
        description: 'A test store',
        category: 'Electronics',
        isActive: true,
        ...overrides,
    };

    const { rows } = await query(
        `INSERT INTO stores (owner_id, name, description, category, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, data.name, data.description, data.category, data.isActive]
    );

    return { ...rows[0], _id: rows[0].id };
};

export const createTestProduct = async (storeId, sellerId, overrides = {}) => {
    const data = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        stock: 100,
        category: 'Electronics',
        isActive: true,
        ...overrides,
    };

    const { rows } = await query(
        `INSERT INTO products (store_id, seller_id, name, description, price, category, stock, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
            storeId,
            sellerId,
            data.name,
            data.description,
            data.price,
            data.category,
            data.stock,
            data.isActive,
        ]
    );

    return { ...rows[0], _id: rows[0].id };
};

export const createTestOrder = async (customerId, product, overrides = {}) => {
    const quantity = overrides.quantity ?? 2;
    const itemsPrice = overrides.itemsPrice ?? product.price * quantity;
    const shippingPrice = overrides.shippingPrice ?? 0;
    const taxPrice = overrides.taxPrice ?? 0;
    const totalPrice = overrides.totalPrice ?? itemsPrice + shippingPrice + taxPrice;

    const shippingAddress = overrides.shippingAddress ?? {
        name: 'Test',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test',
    };

    const { rows } = await query(
        `INSERT INTO orders
            (order_number, customer_id, shipping_address, payment_method,
             items_price, shipping_price, tax_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
            `ORD-TEST-${randomUUID().slice(0, 8)}`,
            customerId,
            JSON.stringify(shippingAddress),
            overrides.paymentMethod ?? 'cod',
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
        ]
    );
    const order = rows[0];

    await query(
        `INSERT INTO order_items
            (order_id, line_no, product_id, store_id, seller_id, name, price, quantity)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7)`,
        [
            order.id,
            product.id ?? product._id,
            product.store_id ?? product.store,
            product.seller_id ?? product.seller,
            product.name,
            product.price,
            quantity,
        ]
    );

    return { ...order, _id: order.id };
};

export const createTestSettings = async (overrides = {}) => {
    const { rows } = await query(
        `INSERT INTO settings (id, tax_rate, shipping_fee, fixed_fee_per_order)
         VALUES (true, $1, $2, $3)
         ON CONFLICT (id) DO UPDATE
            SET tax_rate = EXCLUDED.tax_rate,
                shipping_fee = EXCLUDED.shipping_fee,
                fixed_fee_per_order = EXCLUDED.fixed_fee_per_order
         RETURNING *`,
        [overrides.taxRate ?? 8, overrides.shippingFee ?? 10, overrides.fixedFeePerOrder ?? 2]
    );
    return rows[0];
};

/** True when the value is a valid uuid (used by tests that used Mongo ObjectIds). */
export { isUuid };
