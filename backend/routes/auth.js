import express from 'express';
import { register, login, getMe, updateProfile, forgotPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);

export default router;
