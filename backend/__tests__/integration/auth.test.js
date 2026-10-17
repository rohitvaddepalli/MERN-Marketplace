import request from 'supertest';
import { app } from '../../server.js';
import { createTestUser, generateToken, getAuthCookie } from '../helpers.js';

/**
 * Auth endpoints in the Clerk era:
 *   - register / login / password reset / Google OAuth → handled by Clerk
 *     client-side (they no longer exist on the API).
 *   - GET /me, PUT /updateprofile, POST /logout → local profile endpoints,
 *     protected by the Clerk session (test seam substitutes the identity).
 */
describe('Auth Endpoints', () => {
    describe('Removed Clerk-owned endpoints', () => {
        it('no longer exposes POST /api/auth/register', async () => {
            const res = await request(app).post('/api/auth/register').send({
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
            });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('no longer exposes POST /api/auth/login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'a@b.com', password: 'password123' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('no longer exposes POST /api/auth/forgotpassword', async () => {
            const res = await request(app)
                .post('/api/auth/forgotpassword')
                .send({ email: 'a@b.com' });

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/auth/me', () => {
        it('rejects unauthenticated requests', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('returns the local profile for an authenticated session', async () => {
            const user = await createTestUser({ email: 'me@example.com', name: 'Me User' });
            const token = generateToken(user._id, user.role);

            const res = await request(app).get('/api/auth/me').set('Cookie', getAuthCookie(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('me@example.com');
            expect(res.body.user.name).toBe('Me User');
            expect(res.body.user._id).toBe(user._id);
        });

        it('rejects an unknown user id in the token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', getAuthCookie('11111111-1111-4111-8111-111111111111'));

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/auth/updateprofile', () => {
        it('updates allowed profile fields', async () => {
            const user = await createTestUser({ email: 'upd@example.com' });
            const token = generateToken(user._id, user.role);

            const res = await request(app)
                .put('/api/auth/updateprofile')
                .set('Cookie', getAuthCookie(token))
                .send({ name: 'Updated Name', phone: '555-0100' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.name).toBe('Updated Name');
            expect(res.body.user.phone).toBe('555-0100');
        });

        it('rejects a payload with no valid fields', async () => {
            const user = await createTestUser({ email: 'nofields@example.com' });
            const token = generateToken(user._id, user.role);

            const res = await request(app)
                .put('/api/auth/updateprofile')
                .set('Cookie', getAuthCookie(token))
                .send({ role: 'admin' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects unauthenticated requests', async () => {
            const res = await request(app)
                .put('/api/auth/updateprofile')
                .send({ name: 'Nope' });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('succeeds for an authenticated session', async () => {
            const user = await createTestUser({ email: 'logout@example.com' });
            const token = generateToken(user._id, user.role);

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', getAuthCookie(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
