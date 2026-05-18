const errorCodes = {
    CastError: { statusCode: 404, code: 'RESOURCE_NOT_FOUND' },
    11000: { statusCode: 400, code: 'DUPLICATE_FIELD' },
    ValidationError: { statusCode: 400, code: 'VALIDATION_ERROR' },
    JsonWebTokenError: { statusCode: 401, code: 'INVALID_TOKEN' },
    TokenExpiredError: { statusCode: 401, code: 'TOKEN_EXPIRED' },
};

export const errorHandler = (err, req, res, _next) => {
    let { statusCode, code } = errorCodes[err.name] || errorCodes[err.code] || {};
    let message = err.message;

    if (!statusCode) {
        statusCode = err.statusCode || 500;
        code = err.code || 'SERVER_ERROR';
    }

    if (err.name === 'ValidationError') {
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
    }

    if (err.name === 'CastError') {
        message = 'Resource not found';
    }

    if (err.code === 11000) {
        message = 'Duplicate field value entered';
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
