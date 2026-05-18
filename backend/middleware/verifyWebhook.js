import crypto from 'crypto';

export const verifyCloudinaryWebhook = (req, res, next) => {
    const signature = req.headers['x-cloudinary-signature'];
    const timestamp = req.headers['x-cloudinary-timestamp'];

    if (!signature || !timestamp) {
        return res.status(401).json({
            success: false,
            message: 'Missing webhook signature',
        });
    }

    const payload = JSON.stringify(req.body);
    const expectedSig = crypto
        .createHash('sha256')
        .update(payload + timestamp + process.env.CLOUDINARY_API_SECRET)
        .digest('hex');

    if (signature !== expectedSig) {
        return res.status(401).json({
            success: false,
            message: 'Invalid webhook signature',
        });
    }

    next();
};

export const verifyGenericWebhook = (secret) => {
    return (req, res, next) => {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        if (!signature || !timestamp) {
            return res.status(401).json({
                success: false,
                message: 'Missing webhook signature',
            });
        }

        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(timestamp + '.' + payload)
            .digest('hex');

        if (signature !== expectedSig) {
            return res.status(401).json({
                success: false,
                message: 'Invalid webhook signature',
            });
        }

        next();
    };
};
