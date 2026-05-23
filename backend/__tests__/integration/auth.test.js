import request from 'supertest';
import { app } from '../../server.js';
import { createTestUser, generateToken, getAuthCookie } from '../helpers.js';

describe('Auth Endpoints', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new customer user', async () => {
            const res = await request(app).post('/api/auth/register').send({
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            await createTestUser({ email: 'dup@example.com' });

            const res = await request(app).post('/api/auth/register').send({
                name: 'Dup User',
                email: 'dup@example.com',
                password: 'password123',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject registration without required fields', async () => {
            const res = await request(app).post('/api/auth/register').send({ name: 'No Email' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            await createTestUser({
                email: 'login@example.com',
                password: 'password123',
            });

            const res = await request(app).post('/api/auth/login').send({
                email: 'login@example.com',
                password: 'password123',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject invalid password', async () => {
            await createTestUser({
                email: 'wrongpass@example.com',
                password: 'password123',
            });

            const res = await request(app).post('/api/auth/login').send({
                email: 'wrongpass@example.com',
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user profile', async () => {
            const user = await createTestUser();
            const token = generateToken(user._id, user.role || 'customer');

            const res = await request(app).get('/api/auth/me').set('Cookie', getAuthCookie(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe(user.email);
        });

        it('should reject unauthenticated requests', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(401);
        });
    });
});
