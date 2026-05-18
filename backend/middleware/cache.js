import crypto from 'crypto';

export const setCache = (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    res.set('Cache-Control', 'private, max-age=60, must-revalidate');

    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const stringBody = JSON.stringify(body);
        // Use sha1 with a 16-char prefix — ETags need uniqueness, not crypto strength.
        // sha1 is the fastest built-in digest in Node's native crypto module.
        // NOTE: For high-traffic routes, consider a Redis-backed cache that stores
        // pre-serialised responses and skips the hash on every request.
        const etag = crypto.createHash('sha1').update(stringBody).digest('hex').slice(0, 16);
        res.set('ETag', `"${etag}"`);

        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end();
        }

        return originalJson(body);
    };

    next();
};

export const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};
