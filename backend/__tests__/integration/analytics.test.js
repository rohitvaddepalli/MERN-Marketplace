import request from 'supertest';
import { app } from '../../server.js';
import {
    createTestUser,
    createTestStore,
    createTestProduct,
    createTestOrder,
    generateToken,
    getAuthCookie,
} from '../helpers.js';

describe('Analytics Endpoints', () => {
    let seller, sellerToken, admin, adminToken, store, product, customer;

    beforeEach(async () => {
        seller = await createTestUser({ email: 'seller@example.com', role: 'seller' });
        customer = await createTestUser({ email: 'customer@example.com', role: 'customer' });
        admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
        store = await createTestStore(seller._id);
        product = await createTestProduct(store._id, seller._id, { price: 100, stock: 50 });
        await createTestOrder(customer._id, product);
        sellerToken = generateToken(seller._id, 'seller');
        adminToken = generateToken(admin._id, 'admin');
    });

    // ── Access control ─────────────────────────────────────────────────────────
    describe('Access control', () => {
        it('should reject unauthenticated requests', async () => {
            const res = await request(app).get('/api/analytics/sales');
            expect(res.status).toBe(401);
        });

        it('should reject customers from seller analytics', async () => {
            const customerToken = generateToken(customer._id, 'customer');
            const res = await request(app)
                .get('/api/analytics/sales')
                .set('Cookie', getAuthCookie(customerToken));

            expect([401, 403]).toContain(res.status);
        });
    });

    // ── Seller analytics ───────────────────────────────────────────────────────
    describe('GET /api/analytics/sales', () => {
        it('should return sales analytics for the seller', async () => {
            const res = await request(app)
                .get('/api/analytics/sales')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('totalRevenue');
            expect(res.body.analytics).toHaveProperty('totalOrders');
            expect(res.body.analytics).toHaveProperty('salesData');
            expect(Array.isArray(res.body.analytics.salesData)).toBe(true);
        });

        it('should accept a custom period query param', async () => {
            const res = await request(app)
                .get('/api/analytics/sales?period=7')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
        });

        it('should return zero revenue for seller with no orders', async () => {
            const newSeller = await createTestUser({
                email: 'new-seller@example.com',
                role: 'seller',
            });
            const newToken = generateToken(newSeller._id, 'seller');

            const res = await request(app)
                .get('/api/analytics/sales')
                .set('Cookie', getAuthCookie(newToken));

            expect(res.status).toBe(200);
            expect(res.body.analytics.totalRevenue).toBe(0);
            expect(res.body.analytics.totalOrders).toBe(0);
        });
    });

    describe('GET /api/analytics/customers', () => {
        it('should return customer analytics for the seller', async () => {
            const res = await request(app)
                .get('/api/analytics/customers')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('totalCustomers');
            expect(res.body.analytics).toHaveProperty('topCustomers');
            expect(res.body.analytics).toHaveProperty('repeatCustomerRate');
        });
    });

    describe('GET /api/analytics/products', () => {
        it('should return product performance analytics', async () => {
            const res = await request(app)
                .get('/api/analytics/products')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('topProducts');
            expect(res.body.analytics).toHaveProperty('categoryPerformance');
        });
    });

    describe('GET /api/analytics/inventory-forecast', () => {
        it('should return inventory forecast for seller products', async () => {
            const res = await request(app)
                .get('/api/analytics/inventory-forecast')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.forecast)).toBe(true);
        });

        it('should accept a custom days param', async () => {
            const res = await request(app)
                .get('/api/analytics/inventory-forecast?days=60')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(200);
        });
    });

    // ── Admin analytics ────────────────────────────────────────────────────────
    describe('GET /api/analytics/admin/sales', () => {
        it('should return system-wide sales analytics for admin', async () => {
            const res = await request(app)
                .get('/api/analytics/admin/sales')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('totalRevenue');
            expect(res.body.analytics).toHaveProperty('salesData');
        });

        it('should reject non-admin users from admin analytics', async () => {
            const res = await request(app)
                .get('/api/analytics/admin/sales')
                .set('Cookie', getAuthCookie(sellerToken));

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/analytics/admin/customers', () => {
        it('should return system-wide customer analytics', async () => {
            const res = await request(app)
                .get('/api/analytics/admin/customers')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('totalCustomers');
            expect(res.body.analytics).toHaveProperty('repeatCustomerRate');
        });
    });

    describe('GET /api/analytics/admin/products', () => {
        it('should return system-wide product analytics', async () => {
            const res = await request(app)
                .get('/api/analytics/admin/products')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.analytics).toHaveProperty('topProducts');
            expect(res.body.analytics).toHaveProperty('categoryPerformance');
        });
    });
});
