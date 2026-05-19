import request from 'supertest';
import { app } from '../../server.js';
import Settings from '../../models/Settings.js';
import {
    createTestUser,
    createTestStore,
    createTestProduct,
    generateToken,
    getAuthCookie,
} from '../helpers.js';


describe('Order Endpoints', () => {
    let customer, seller, store, product, customerToken;

    beforeEach(async () => {
        // Ensure default settings match what tests expect
        await Settings.deleteMany({});
        await Settings.create({ taxRate: 0, shippingFee: 0, fixedFeePerOrder: 0 });

        customer = await createTestUser({
            email: 'customer@example.com',
            role: 'customer',
        });
        seller = await createTestUser({
            email: 'seller2@example.com',
            role: 'seller',
        });
        store = await createTestStore(seller._id);
        product = await createTestProduct(store._id, seller._id, { stock: 100 });
        customerToken = generateToken(customer._id);
    });

    describe('POST /api/orders', () => {
        it('should create an order with valid items', async () => {
            const itemsPrice = product.price * 2;
            const taxRate = 0;
            const shippingFee = 0;
            const totalPrice = itemsPrice + taxRate + shippingFee;

            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', getAuthCookie(customerToken))
                .send({
                    items: [
                        {
                            product: product._id,
                            store: store._id,
                            quantity: 2,
                        },
                    ],
                    shippingAddress: {
                        name: 'Test',
                        street: '123 St',
                        city: 'City',
                        state: 'ST',
                        zipCode: '12345',
                        country: 'Country',
                    },
                    paymentMethod: 'cod',
                    itemsPrice,
                    shippingPrice: shippingFee,
                    taxPrice: taxRate,
                    totalPrice,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should reject orders with tampered prices', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', getAuthCookie(customerToken))
                .send({
                    items: [
                        {
                            product: product._id,
                            store: store._id,
                            quantity: 2,
                        },
                    ],
                    shippingAddress: {
                        name: 'Test',
                        street: '123 St',
                        city: 'City',
                        state: 'ST',
                        zipCode: '12345',
                        country: 'Country',
                    },
                    paymentMethod: 'cod',
                    itemsPrice: 0.01,
                    shippingPrice: 0,
                    taxPrice: 0,
                    totalPrice: 0.01,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Price mismatch');
        });

        it('should reject orders with insufficient stock', async () => {
            const bogusQuantity = 99999;
            const itemsPrice = product.price * bogusQuantity;

            const res = await request(app)
                .post('/api/orders')
                .set('Cookie', getAuthCookie(customerToken))
                .send({
                    items: [
                        {
                            product: product._id,
                            store: store._id,
                            quantity: bogusQuantity,
                        },
                    ],
                    shippingAddress: {
                        name: 'Test',
                        street: '123 St',
                        city: 'City',
                        state: 'ST',
                        zipCode: '12345',
                        country: 'Country',
                    },
                    paymentMethod: 'cod',
                    itemsPrice,
                    shippingPrice: 0,
                    taxPrice: 0,
                    totalPrice: itemsPrice,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Insufficient stock');
        });
    });

    describe('GET /api/orders/myorders', () => {
        it('should return customer orders', async () => {
            const res = await request(app)
                .get('/api/orders/myorders')
                .set('Cookie', getAuthCookie(customerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
