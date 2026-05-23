import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const getTokenFromRequest = (req) => {
    if (req.cookies && req.cookies.access_token) {
        return req.cookies.access_token;
    }

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
                message: 'Not authorized to access this route',
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Always cast to ObjectId so aggregation pipelines work correctly
            // (they don't auto-cast strings the way Mongoose queries do)
            const userId = new mongoose.Types.ObjectId(decoded.id);

            if (decoded.role) {
                // PERF: New token format — role embedded, zero DB round-trips
                req.user = { _id: userId, role: decoded.role };
            } else {
                // COMPAT: Legacy token — one DB lookup until the user re-logs-in
                const user = await User.findById(userId).select('role');
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found',
                    });
                }
                req.user = { _id: userId, role: user.role };
            }

            next();
        } catch (_error) {
            res.clearCookie('access_token');
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired',
            });
        }
    } catch (_error) {
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication',
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`,
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
            const userId = new mongoose.Types.ObjectId(decoded.id);

            if (decoded.role) {
                req.user = { _id: userId, role: decoded.role };
            } else {
                const user = await User.findById(userId).select('role');
                if (user) {
                    req.user = { _id: userId, role: user.role };
                }
            }
            next();
        } catch (_error) {
            // If token is invalid, just proceed as guest
            next();
        }
    } catch (_error) {
        next();
    }
};
