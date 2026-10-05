import express from 'express';
import crypto from 'crypto';
import authController from '../controllers/authController.js';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import { validateZod } from '../middleware/validateZod.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3,
    keyGenerator: (req, res) => req.body?.email ? req.body.email.toLowerCase() : ipKeyGenerator(req, res),
    message: {
        success: false,
        message: 'Too many password reset requests for this email. Please try again in 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// SECURITY: Rate limit logins based on IP + Hashed Email to prevent
// distributed brute-force attacks against a single account.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // max 20 login attempts per IP/Email combo per 15 min
    keyGenerator: (req, res) => {
        const ip = ipKeyGenerator(req, res);
        if (req.body?.email) {
            const emailHash = crypto.createHash('sha256').update(req.body.email.toLowerCase()).digest('hex');
            return `${ip}_${emailHash}`;
        }
        return ip;
    },
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// SECURITY: Global IP rate limiter for logins to prevent brute-forcing
// across multiple accounts from the same IP.
const globalLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // max 50 login attempts per IP per 15 min
    keyGenerator: (req, res) => ipKeyGenerator(req, res),
    message: {
        success: false,
        message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post(
    '/register',
    validateZod(registerSchema),
    asyncHandler(authController.register)
);

router.post(
    '/login',
    globalLoginLimiter,
    loginLimiter,
    validateZod(loginSchema),
    asyncHandler(authController.login)
);
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgotpassword', forgotPasswordLimiter, asyncHandler(authController.forgotPassword));
router.put('/resetpassword/:resettoken', asyncHandler(authController.resetPassword));
router.get('/me', protect, asyncHandler(authController.getMe));
router.put('/updateprofile', protect, asyncHandler(authController.updateProfile));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.socialLoginCallback
);

export default router;
