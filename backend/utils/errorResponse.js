/**
 * Standardized error response format
 * Ensures consistent error structure across all endpoints
 * 
 * Format: { success: false, message: string, code?: string }
 */

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} [code] - Optional error code for client-side handling
 */
export const sendError = (res, statusCode, message, code = null) => {
    const response = {
        success: false,
        message,
    };

    if (code) {
        response.code = code;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {string} [message] - Optional success message
 */
export const sendSuccess = (res, statusCode, data, message = null) => {
    // Spread data first, then overwrite success so data.success can never shadow it
    const response = {
        ...data,
        success: true,
    };

    if (message) {
        response.message = message;
    }

    return res.status(statusCode).json(response);
};

// Common error codes for client-side handling
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    PRICE_MISMATCH: 'PRICE_MISMATCH',
    INVALID_STATUS: 'INVALID_STATUS',
    SERVER_ERROR: 'SERVER_ERROR',
};
