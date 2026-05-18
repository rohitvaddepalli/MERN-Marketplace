import request from 'supertest';
import { app } from '../../server.js';
import { createTestUser, createTestStore, generateToken, getAuthCookie } from '../helpers.js';

describe('Store Endpoints', () => {
    let seller, token, store;

    beforeEach(async () => {
        seller = await createTestUser({
            email: 'store-seller@example.com',
            role: 'seller',
        });
        token = generateToken(seller._id);
        store = await createTestStore(seller._id);
    });

    describe('GET /api/stores', () => {
        it('should list active stores', async () => {
            const res = await request(app).get('/api/stores');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
        });
    });

    describe('POST /api/stores', () => {
        it('should prevent seller from having multiple stores', async () => {
            const res = await request(app)
                .post('/api/stores')
                .set('Cookie', getAuthCookie(token))
                .send({
                    name: 'Second Store',
                    description: 'Trying to create another',
                    category: 'Books',
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already have a store');
        });
    });

    describe('GET /api/stores/:id', () => {
        it('should get store with products', async () => {
            const res = await request(app).get(`/api/stores/${store._id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.store.name).toBe('Test Store');
        });
    });

    describe('GET /api/stores/my/store', () => {
        it('should return seller store', async () => {
            const res = await request(app)
                .get('/api/stores/my/store')
                .set('Cookie', getAuthCookie(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.store.name).toBeDefined();
        });
    });
});
