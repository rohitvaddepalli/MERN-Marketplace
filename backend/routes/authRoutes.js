import express from 'express';
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
    keyGenerator: (req) => req.body?.email ? req.body.email.toLowerCase() : ipKeyGenerator(req),
    message: {
        success: false,
        message: 'Too many password reset requests for this email. Please try again in 1 hour.',
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
