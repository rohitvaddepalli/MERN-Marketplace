import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';
import config from '../config/unifiedConfig.js';

export const pickAllowedFields = (source = {}, allowedFields = []) => {
    const result = {};
    for (const field of allowedFields) {
        if (source[field] !== undefined) {
            result[field] = source[field];
        }
    }
    return result;
};

export class BaseController {
    pickAllowedFields(source, allowedFields) {
        return pickAllowedFields(source, allowedFields);
    }

    handleSuccess(res, data = {}, status = 200) {
        return res.status(status).json({
            success: true,
            ...data,
        });
    }

    handleError(error, res, context = 'Operation') {
        logger.error(`${context} error: ${error.message}`, { error });

        if (config.sentry.dsn) {
            Sentry.captureException(error);
        }

        const statusCode = error.statusCode || 500;
        const code = error.code || 'SERVER_ERROR';
        const message = error.message || 'Internal Server Error';

        const response = {
            success: false,
            message,
            code,
        };

        if (config.env === 'development' && statusCode === 500) {
            response.stack = error.stack;
        }

        return res.status(statusCode).json(response);
    }
}
