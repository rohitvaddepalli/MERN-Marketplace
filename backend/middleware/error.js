const errorCodes = {
    CastError: { statusCode: 404, code: 'RESOURCE_NOT_FOUND', message: 'Resource not found' },
    11000: { statusCode: 400, code: 'DUPLICATE_FIELD', message: 'Duplicate field value entered' },
    ValidationError: { statusCode: 400, code: 'VALIDATION_ERROR' },
    JsonWebTokenError: { statusCode: 401, code: 'INVALID_TOKEN' },
    TokenExpiredError: { statusCode: 401, code: 'TOKEN_EXPIRED' },
    23505: {
        statusCode: 409,
        code: 'DUPLICATE',
        message: 'A record with that value already exists',
    },
    23503: { statusCode: 400, code: 'FK_VIOLATION', message: 'Referenced record does not exist' },
    '22P02': { statusCode: 400, code: 'INVALID_INPUT', message: 'Invalid input syntax' },
};

export const errorHandler = (err, req, res, _next) => {
    const mapped = errorCodes[err.name] || errorCodes[err.code] || {};
    const statusCode = mapped.statusCode || err.statusCode || 500;
    const code = mapped.code || err.code || 'SERVER_ERROR';
    let message = mapped.message || err.message;

    if (err.name === 'ValidationError' && err.errors) {
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
    }

    const response = {
        success: false,
        message,
        code,
    };

    if (process.env.NODE_ENV === 'development' && statusCode === 500) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
