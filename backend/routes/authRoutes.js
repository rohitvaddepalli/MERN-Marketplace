import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Registration, login, password reset and Google OAuth are handled entirely by
// Clerk on the client. The API only exposes profile reads/updates for the
// authenticated session (Bearer token or same-origin Clerk cookie).

router.get('/me', protect, asyncHandler(authController.getMe));
router.put('/updateprofile', protect, asyncHandler(authController.updateProfile));
router.post('/logout', protect, asyncHandler(authController.logout));

export default router;
