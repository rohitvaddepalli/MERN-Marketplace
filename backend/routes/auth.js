import express from 'express';
import { register, login, logout, getMe, updateProfile, forgotPassword, resetPassword, socialLoginCallback } from '../controllers/authController.js';
import passport from 'passport';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Clears HTTP-only auth cookie
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), socialLoginCallback);

export default router;
