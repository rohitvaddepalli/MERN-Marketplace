import request from 'supertest';
import { app } from '../../server.js';
import {
    createTestUser,
    createTestStore,
    createTestProduct,
    generateToken,
    getAuthCookie,
} from '../helpers.js';


describe('Product Endpoints', () => {
    let seller, store, token;

    beforeEach(async () => {
        seller = await createTestUser({
            email: 'seller@example.com',
            role: 'seller',
        });
        store = await createTestStore(seller._id);
        token = generateToken(seller._id);
        await createTestProduct(store._id, seller._id);
    });

    describe('GET /api/products', () => {
        it('should list active products', async () => {
            const res = await request(app).get('/api/products');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.length).toBeGreaterThan(0);
        });

        it('should filter by category', async () => {
            const res = await request(app).get('/api/products').query({ category: 'Electronics' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should paginate results', async () => {
            const res = await request(app).get('/api/products').query({ page: 1, limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.page).toBe(1);
            expect(res.body.pages).toBeDefined();
        });
    });

    describe('POST /api/products', () => {
        it('should create a product as seller', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Cookie', getAuthCookie(token))
                .send({
                    name: 'New Product',
                    description: 'Brand new product',
                    price: 49.99,
                    stock: 50,
                    category: 'Electronics',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should reject creation without auth', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({ name: 'Hacked', price: 0.01 });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/products/featured', () => {
        it('should return top rated products', async () => {
            const res = await request(app).get('/api/products/featured');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
