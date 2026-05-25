import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';
import config from '../config/unifiedConfig.js';

export class BaseController {
    handleSuccess(res, data = {}, status = 200) {
        return res.status(status).json({
            success: true,
            ...data
        });
    }

    handleError(error, res, context = 'Operation') {
        logger.error(`${context} error: ${error.message}`, { error });
        
        if (config.sentry.dsn) {
            Sentry.captureException(error);
        }
        
        // Mimic global error handler logic for expected DB errors
        let statusCode = error.statusCode || 500;
        let code = error.code || 'SERVER_ERROR';
        let message = error.message || 'Internal Server Error';

        if (error.name === 'ValidationError') {
            message = Object.values(error.errors).map(val => val.message).join(', ');
            statusCode = 400;
            code = 'VALIDATION_ERROR';
        }
        if (error.name === 'CastError') {
            message = 'Resource not found';
            statusCode = 404;
            code = 'RESOURCE_NOT_FOUND';
        }
        if (error.code === 11000) {
            message = 'Duplicate field value entered';
            statusCode = 400;
            code = 'DUPLICATE_FIELD';
        }
        if (error.name === 'JsonWebTokenError') {
            message = 'Not authorized to access this route';
            statusCode = 401;
            code = 'INVALID_TOKEN';
        }
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
            statusCode = 401;
            code = 'TOKEN_EXPIRED';
        }

        const response = {
            success: false,
            message,
            code
        };

        if (config.env === 'development' && statusCode === 500) {
            response.stack = error.stack;
        }

        return res.status(statusCode).json(response);
    }
}
