import express from 'express';
import { register, login, logout, getMe, updateProfile, forgotPassword, resetPassword, socialLoginCallback } from '../controllers/authController.js';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    validate
], register);

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate
], login);
router.post('/logout', logout); // Clears HTTP-only auth cookie
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialLoginCallback);

export default router;
