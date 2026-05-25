import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as authService from '../../services/authService.js';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');
vi.mock('../../utils/sendEmail.js', () => ({
    default: vi.fn().mockResolvedValue(true)
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
    });

    describe('generateToken', () => {
        it('should generate a JWT', () => {
            jwt.sign.mockReturnValue('mocked-token');
            const user = { _id: '123', role: 'customer' };
            
            const token = authService.generateToken(user);
            
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: '123', role: 'customer' },
                'testsecret',
                expect.any(Object)
            );
            expect(token).toBe('mocked-token');
        });
    });

    describe('getCookieOptions', () => {
        it('should return cookie options for dev', () => {
            process.env.NODE_ENV = 'development';
            const options = authService.getCookieOptions();
            
            expect(options.httpOnly).toBe(true);
            expect(options.secure).toBe(false);
            expect(options.sameSite).toBe('lax');
        });

        it('should return cookie options for prod', () => {
            process.env.NODE_ENV = 'production';
            const options = authService.getCookieOptions();
            
            expect(options.secure).toBe(true);
            expect(options.sameSite).toBe('none');
        });
    });

    describe('sendTokenResponse', () => {
        it('should set cookie and return json', () => {
            jwt.sign.mockReturnValue('token');
            const res = {
                cookie: vi.fn(),
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const user = { _id: '1', name: 'Test', email: 'test@t.com', role: 'customer' };
            
            authService.sendTokenResponse(user, 200, res);
            
            expect(res.cookie).toHaveBeenCalledWith('access_token', 'token', expect.any(Object));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'token'
            }));
        });
    });
});
