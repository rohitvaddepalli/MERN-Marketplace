import { BaseController } from '../controllers/BaseController.js';
const baseController = new BaseController();

/**
 * Async error handler wrapper
 * Eliminates repetitive try-catch blocks in controllers
 * 
 * @param {Function} fn - Async controller function
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
