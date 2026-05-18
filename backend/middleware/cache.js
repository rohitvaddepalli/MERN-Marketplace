import crypto from 'crypto';

export const setCache = (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    res.set('Cache-Control', 'private, max-age=60, must-revalidate');

    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const stringBody = JSON.stringify(body);
        const etag = crypto.createHash('md5').update(stringBody).digest('hex');
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
