/**
 * Wraps an async controller function to catch any errors
 * and forward them to Express error middleware via next()
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
