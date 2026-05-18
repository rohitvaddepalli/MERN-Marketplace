import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword,
    socialLoginCallback,
} from '../controllers/authController.js';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validate } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Per-email rate limit for password reset — 3 requests per email per hour.
// Keyed on email body field (falling back to IP) so brute-forcing different
// emails from a single IP, or one email from many IPs, is both blocked.
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3,
    keyGenerator: (req) => (req.body?.email || req.ip).toLowerCase(),
    message: {
        success: false,
        message: 'Too many password reset requests for this email. Please try again in 1 hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        validate,
    ],
    register
);

router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
        validate,
    ],
    login
);
router.post('/logout', logout);
router.post('/forgotpassword', forgotPasswordLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    socialLoginCallback
);

export default router;
