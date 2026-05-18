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
            const expectedEtag = '"' + crypto.createHash('md5').update(bodyStr).digest('hex') + '"';

            req.headers = { 'if-none-match': expectedEtag };
            res.json(body);

            expect(res.status).toHaveBeenCalledWith(304);
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
