/**
 * Unit tests for backend/middleware/error.js
 *
 * Covers every branch in errorHandler:
 *  - CastError      → 404 RESOURCE_NOT_FOUND
 *  - Mongoose dup   → 400 DUPLICATE_FIELD
 *  - ValidationError → 400 VALIDATION_ERROR (multi-field message join)
 *  - JsonWebTokenError → 401 INVALID_TOKEN
 *  - TokenExpiredError → 401 TOKEN_EXPIRED
 *  - Generic express error (err.statusCode set)
 *  - Unrecognised error → 500 SERVER_ERROR
 *  - Stack trace exposed only in development
 */
import { errorHandler } from '../../middleware/error.js';

// Helper: create a minimal res mock
const makeRes = () => {
    const res = { _statusCode: null, _body: null };
    res.status = (code) => {
        res._statusCode = code;
        return res;
    };
    res.json = (body) => {
        res._body = body;
        return res;
    };
    return res;
};

const makeReq = () => ({});
const next = () => {};

describe('errorHandler middleware', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    // ── Mongoose CastError ────────────────────────────────────────────────────
    describe('CastError (invalid ObjectId)', () => {
        it('should return 404 with RESOURCE_NOT_FOUND code', () => {
            const err = { name: 'CastError', message: 'Cast to ObjectId failed' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(404);
            expect(res._body.success).toBe(false);
            expect(res._body.code).toBe('RESOURCE_NOT_FOUND');
            expect(res._body.message).toBe('Resource not found');
        });
    });

    // ── Mongoose duplicate key ─────────────────────────────────────────────────
    describe('Duplicate key error (code 11000)', () => {
        it('should return 400 with DUPLICATE_FIELD code', () => {
            const err = { name: 'MongoServerError', code: 11000, message: 'E11000 duplicate key' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(400);
            expect(res._body.code).toBe('DUPLICATE_FIELD');
            expect(res._body.message).toBe('Duplicate field value entered');
        });
    });

    // ── Mongoose ValidationError ───────────────────────────────────────────────
    describe('ValidationError', () => {
        it('should return 400 and join all field messages', () => {
            const err = {
                name: 'ValidationError',
                errors: {
                    name: { message: 'Name is required' },
                    price: { message: 'Price must be positive' },
                },
            };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(400);
            expect(res._body.code).toBe('VALIDATION_ERROR');
            // Both field messages should appear in the joined string
            expect(res._body.message).toContain('Name is required');
            expect(res._body.message).toContain('Price must be positive');
        });

        it('should return 400 for single-field validation error', () => {
            const err = {
                name: 'ValidationError',
                errors: {
                    email: { message: 'Email is invalid' },
                },
            };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(400);
            expect(res._body.message).toBe('Email is invalid');
        });
    });

    // ── JWT errors ────────────────────────────────────────────────────────────
    describe('JsonWebTokenError', () => {
        it('should return 401 with INVALID_TOKEN code', () => {
            const err = { name: 'JsonWebTokenError', message: 'invalid signature' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(401);
            expect(res._body.code).toBe('INVALID_TOKEN');
        });
    });

    describe('TokenExpiredError', () => {
        it('should return 401 with TOKEN_EXPIRED code', () => {
            const err = { name: 'TokenExpiredError', message: 'jwt expired' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(401);
            expect(res._body.code).toBe('TOKEN_EXPIRED');
        });
    });

    // ── Generic error with statusCode set ─────────────────────────────────────
    describe('Custom HTTP errors', () => {
        it('should use err.statusCode when set', () => {
            const err = { name: 'ForbiddenError', statusCode: 403, message: 'Forbidden', code: 'FORBIDDEN' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(403);
            expect(res._body.message).toBe('Forbidden');
            expect(res._body.code).toBe('FORBIDDEN');
        });

        it('should default to 500 and SERVER_ERROR for unrecognised errors', () => {
            const err = new Error('Something unexpected');
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._statusCode).toBe(500);
            expect(res._body.code).toBe('SERVER_ERROR');
            expect(res._body.success).toBe(false);
        });
    });

    // ── Stack trace exposure ───────────────────────────────────────────────────
    describe('Stack trace in development', () => {
        it('should include stack in development for 500 errors', () => {
            process.env.NODE_ENV = 'development';
            const err = new Error('Crash');
            err.stack = 'Error: Crash\n    at someFunction';
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._body.stack).toBeDefined();
        });

        it('should NOT include stack in production', () => {
            process.env.NODE_ENV = 'production';
            const err = new Error('Crash');
            err.stack = 'Error: Crash\n    at someFunction';
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._body.stack).toBeUndefined();
        });

        it('should NOT include stack for 4xx errors even in development', () => {
            process.env.NODE_ENV = 'development';
            const err = { name: 'CastError', message: 'Cast failed', stack: 'some stack' };
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            // Stack only exposed for 500-level in development
            expect(res._body.stack).toBeUndefined();
        });
    });

    // ── Response shape ────────────────────────────────────────────────────────
    describe('Response shape', () => {
        it('should always include success:false, message, code', () => {
            const err = new Error('Any error');
            const res = makeRes();

            errorHandler(err, makeReq(), res, next);

            expect(res._body).toHaveProperty('success', false);
            expect(res._body).toHaveProperty('message');
            expect(res._body).toHaveProperty('code');
        });
    });
});
