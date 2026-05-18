/**
 * Unit tests for backend/utils/asyncHandler.js
 *
 * asyncHandler wraps an async controller so:
 *  - successful resolution passes result through normally
 *  - rejected promises are forwarded to next() as errors
 *    (no try/catch boilerplate in controllers)
 */
import asyncHandler from '../../utils/asyncHandler.js';

describe('asyncHandler utility', () => {
    const makeReq = () => ({ method: 'GET', path: '/test' });
    const makeRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    it('should call the wrapped function with req, res, next', async () => {
        const controller = vi.fn().mockResolvedValue('ok');
        const wrapped = asyncHandler(controller);

        const req = makeReq();
        const res = makeRes();
        const next = vi.fn();

        await wrapped(req, res, next);

        expect(controller).toHaveBeenCalledWith(req, res, next);
    });

    it('should NOT call next when the controller resolves successfully', async () => {
        const controller = vi.fn().mockResolvedValue(undefined);
        const wrapped = asyncHandler(controller);

        const next = vi.fn();
        await wrapped(makeReq(), makeRes(), next);

        expect(next).not.toHaveBeenCalled();
    });

    it('should call next(err) when the controller rejects', async () => {
        const error = new Error('Controller exploded');
        const controller = vi.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(controller);

        const next = vi.fn();
        await wrapped(makeReq(), makeRes(), next);

        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(error);
    });

    it('should forward the exact error object (not a copy)', async () => {
        const error = new Error('Exact error');
        error.statusCode = 422;
        error.code = 'CUSTOM_CODE';

        const controller = vi.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(controller);

        const next = vi.fn();
        await wrapped(makeReq(), makeRes(), next);

        const forwarded = next.mock.calls[0][0];
        expect(forwarded).toBe(error); // same reference, not a clone
        expect(forwarded.statusCode).toBe(422);
        expect(forwarded.code).toBe('CUSTOM_CODE');
    });

    it('should handle synchronous throws via Promise rejection', async () => {
        const error = new Error('Sync throw');
        // Controllers that throw synchronously inside an async function
        // are converted to rejected promises by the JS runtime
        const controller = async () => {
            throw error;
        };
        const wrapped = asyncHandler(controller);

        const next = vi.fn();
        await wrapped(makeReq(), makeRes(), next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
