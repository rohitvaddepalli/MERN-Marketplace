import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import adminController from '../controllers/adminController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateZod } from '../middleware/validateZod.js';
import { updateSettingsSchema, updateStoreStatusSchema } from '../validators/adminValidator.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', asyncHandler(adminController.getDashboardStats));

// User management
router.get('/users', asyncHandler(adminController.getAllUsers));
router.delete('/users/:id', asyncHandler(adminController.deleteUser));

// Store management
router.get('/stores', asyncHandler(adminController.getAllStores));
router.put('/stores/:id/status', validateZod(updateStoreStatusSchema), asyncHandler(adminController.updateStoreStatus));
router.delete('/stores/:id', asyncHandler(adminController.deleteStore));

// Product management
router.get('/products', asyncHandler(adminController.getAllProducts));
router.delete('/products/:id', asyncHandler(adminController.deleteProduct));

// Order management
router.get('/orders', asyncHandler(adminController.getAllOrders));
router.delete('/orders/:id', asyncHandler(adminController.deleteOrder));

// Settings management
router.get('/settings', asyncHandler(adminController.getSettings));
router.put('/settings', validateZod(updateSettingsSchema), asyncHandler(adminController.updateSettings));

export default router;
