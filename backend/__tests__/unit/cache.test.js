import crypto from 'crypto';
import { setCache, noCache } from '../../middleware/cache.js';

describe('Cache Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { method: 'GET' };
        res = {
            set: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            end: vi.fn().mockReturnThis(),
        };
        next = vi.fn();
    });

    describe('setCache', () => {
        it('should set Cache-Control header for GET requests', () => {
            setCache(req, res, next);

            expect(res.set).toHaveBeenCalledWith(
                'Cache-Control',
                'private, max-age=60, must-revalidate'
            );
            expect(next).toHaveBeenCalled();
        });

        it('should skip for non-GET requests', () => {
            req.method = 'POST';
            setCache(req, res, next);

            expect(res.set).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        it('should return 304 when ETag matches', () => {
            setCache(req, res, next);

            const body = { success: true, message: 'test' };
            const bodyStr = JSON.stringify(body);
            // Middleware uses sha1 with a 16-char prefix (changed from md5)
            const expectedEtag =
                '"' + crypto.createHash('sha1').update(bodyStr).digest('hex').slice(0, 16) + '"';

            req.headers = { 'if-none-match': expectedEtag };
            res.json(body);

            expect(res.status).toHaveBeenCalledWith(304);
        });

        it('should NOT return 304 when ETag does not match', () => {
            setCache(req, res, next);

            const body = { success: true, message: 'test' };
            req.headers = { 'if-none-match': '"stale-etag-value-00"' };
            res.json(body);

            // Status should not be called with 304 for a stale etag
            const was304 = res.status.mock.calls.some(([code]) => code === 304);
            expect(was304).toBe(false);
        });
    });

    describe('noCache', () => {
        it('should set no-cache headers', () => {
            noCache(req, res, next);

            expect(res.set).toHaveBeenCalledWith(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, proxy-revalidate'
            );
            expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
            expect(res.set).toHaveBeenCalledWith('Expires', '0');
            expect(next).toHaveBeenCalled();
        });
    });
});
