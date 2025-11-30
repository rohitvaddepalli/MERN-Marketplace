import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getDashboardStats,
    getAllUsers,
    getAllStores,
    getAllOrders,
    getAllProducts,
    updateStoreStatus,
    deleteUser,
    deleteStore,
    deleteProduct,
    deleteOrder,
    getSettings,
    updateSettings
} from '../controllers/admin.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Store management
router.get('/stores', getAllStores);
router.put('/stores/:id/status', updateStoreStatus);
router.delete('/stores/:id', deleteStore);

// Product management
router.get('/products', getAllProducts);
router.delete('/products/:id', deleteProduct);

// Order management
router.get('/orders', getAllOrders);
router.delete('/orders/:id', deleteOrder);

// Settings management
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;

