import request from 'supertest';
import { app } from '../../server.js';

describe('Health Endpoint', () => {
    describe('GET /api/health', () => {
        it('should return 200 with server status', async () => {
            const res = await request(app).get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Server is running');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    describe('GET /api/settings', () => {
        it('should return public settings', async () => {
            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.settings).toHaveProperty('taxRate');
            expect(res.body.settings).toHaveProperty('shippingFee');
        });
    });
});
