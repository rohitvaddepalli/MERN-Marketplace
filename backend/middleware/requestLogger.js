import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
    req.id = req.id || uuidv4();
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id,
            userId: req.user?._id || '-',
        };

        if (res.statusCode >= 400) {
            logger.error('Request failed', log);
        } else {
            logger.info('Request handled', log);
        }
    });

    next();
};
