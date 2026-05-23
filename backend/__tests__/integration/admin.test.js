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

describe('Admin Endpoints', () => {
    let admin, adminToken, customer, seller, store, product, order;

    beforeEach(async () => {
        admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
        customer = await createTestUser({ email: 'customer@example.com', role: 'customer' });
        seller = await createTestUser({ email: 'seller@example.com', role: 'seller' });
        store = await createTestStore(seller._id);
        product = await createTestProduct(store._id, seller._id);
        order = await createTestOrder(customer._id, product);
        adminToken = generateToken(admin._id, 'admin');
    });

    // ── Access control ─────────────────────────────────────────────────────────
    describe('Access control', () => {
        it('should reject unauthenticated requests to admin routes', async () => {
            const res = await request(app).get('/api/admin/stats');
            expect(res.status).toBe(401);
        });

        it('should reject non-admin users', async () => {
            const customerToken = generateToken(customer._id, 'customer');
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', getAuthCookie(customerToken));
            expect(res.status).toBe(403);
        });
    });

    // ── Dashboard stats ────────────────────────────────────────────────────────
    describe('GET /api/admin/stats', () => {
        it('should return dashboard statistics', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.stats).toHaveProperty('totalUsers');
            expect(res.body.stats).toHaveProperty('totalStores');
            expect(res.body.stats).toHaveProperty('totalProducts');
            expect(res.body.stats).toHaveProperty('totalOrders');
            expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(3);
        });
    });

    // ── Users CRUD ─────────────────────────────────────────────────────────────
    describe('GET /api/admin/users', () => {
        it('should list all users with pagination', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body).toHaveProperty('total');
        });

        it('should filter users by role', async () => {
            const res = await request(app)
                .get('/api/admin/users?role=customer')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.users.every((u) => u.role === 'customer')).toBe(true);
        });

        it('should search users by name or email', async () => {
            const res = await request(app)
                .get('/api/admin/users?search=customer')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject ReDoS-style regex in search', async () => {
            const res = await request(app)
                .get('/api/admin/users?search=' + encodeURIComponent('(a+)+$'))
                .set('Cookie', getAuthCookie(adminToken));

            // Should not hang; must respond within test timeout
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete a non-admin user', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${customer._id}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should refuse to delete admin accounts', async () => {
            const admin2 = await createTestUser({ email: 'admin2@example.com', role: 'admin' });
            const res = await request(app)
                .delete(`/api/admin/users/${admin2._id}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .delete(`/api/admin/users/${fakeId}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(404);
        });
    });

    // ── Stores CRUD ────────────────────────────────────────────────────────────
    describe('GET /api/admin/stores', () => {
        it('should list all stores with pagination', async () => {
            const res = await request(app)
                .get('/api/admin/stores')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.stores)).toBe(true);
        });

        it('should filter by isActive status', async () => {
            const res = await request(app)
                .get('/api/admin/stores?isActive=true')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.stores.every((s) => s.isActive === true)).toBe(true);
        });
    });

    describe('PUT /api/admin/stores/:id/status', () => {
        it('should deactivate a store', async () => {
            const res = await request(app)
                .put(`/api/admin/stores/${store._id}/status`)
                .set('Cookie', getAuthCookie(adminToken))
                .send({ isActive: false });

            expect(res.status).toBe(200);
            expect(res.body.store.isActive).toBe(false);
        });
    });

    describe('DELETE /api/admin/stores/:id', () => {
        it('should delete a store and its products', async () => {
            const res = await request(app)
                .delete(`/api/admin/stores/${store._id}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 for non-existent store', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .delete(`/api/admin/stores/${fakeId}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(404);
        });
    });

    // ── Products ───────────────────────────────────────────────────────────────
    describe('GET /api/admin/products', () => {
        it('should list all products', async () => {
            const res = await request(app)
                .get('/api/admin/products')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.products)).toBe(true);
        });
    });

    describe('DELETE /api/admin/products/:id', () => {
        it('should delete a product', async () => {
            const res = await request(app)
                .delete(`/api/admin/products/${product._id}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // ── Orders ─────────────────────────────────────────────────────────────────
    describe('GET /api/admin/orders', () => {
        it('should list all orders', async () => {
            const res = await request(app)
                .get('/api/admin/orders')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.orders)).toBe(true);
        });

        it('should filter by order status', async () => {
            const res = await request(app)
                .get('/api/admin/orders?status=pending')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.orders.every((o) => o.status === 'pending')).toBe(true);
        });

        it('should search by order number', async () => {
            const res = await request(app)
                .get(`/api/admin/orders?search=${encodeURIComponent('ORD')}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('DELETE /api/admin/orders/:id', () => {
        it('should delete an order', async () => {
            const res = await request(app)
                .delete(`/api/admin/orders/${order._id}`)
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // ── Settings ───────────────────────────────────────────────────────────────
    describe('GET /api/admin/settings', () => {
        it('should return current settings', async () => {
            const res = await request(app)
                .get('/api/admin/settings')
                .set('Cookie', getAuthCookie(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.settings).toHaveProperty('taxRate');
            expect(res.body.settings).toHaveProperty('shippingFee');
        });
    });

    describe('PUT /api/admin/settings', () => {
        it('should update tax rate', async () => {
            const res = await request(app)
                .put('/api/admin/settings')
                .set('Cookie', getAuthCookie(adminToken))
                .send({ taxRate: 10 });

            expect(res.status).toBe(200);
            expect(res.body.settings.taxRate).toBe(10);
        });

        it('should reject invalid tax rate', async () => {
            const res = await request(app)
                .put('/api/admin/settings')
                .set('Cookie', getAuthCookie(adminToken))
                .send({ taxRate: 150 });

            expect(res.status).toBe(400);
        });

        it('should reject negative shipping fee', async () => {
            const res = await request(app)
                .put('/api/admin/settings')
                .set('Cookie', getAuthCookie(adminToken))
                .send({ shippingFee: -5 });

            expect(res.status).toBe(400);
        });
    });
});
