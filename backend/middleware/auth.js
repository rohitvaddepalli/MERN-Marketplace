import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Extract token from request
 * Priority: 1) HTTP-only cookie, 2) Authorization header
 * This allows backward compatibility while preferring secure cookies
 */
const getTokenFromRequest = (req) => {
    // First, check for HTTP-only cookie (more secure)
    if (req.cookies && req.cookies.access_token) {
        return req.cookies.access_token;
    }

    // Fallback to Authorization header for backward compatibility
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }

    return null;
};

export const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            // Clear invalid cookie if present
            res.clearCookie('access_token');
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

export const optionalProtect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
            next();
        } catch (error) {
            // If token is invalid, just proceed as guest
            next();
        }
    } catch (error) {
        next();
    }
};
