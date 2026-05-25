import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/sales', protect, authorize('seller'), asyncHandler(analyticsController.getSalesAnalytics));
router.get('/customers', protect, authorize('seller'), asyncHandler(analyticsController.getCustomerAnalytics));
router.get('/inventory-forecast', protect, authorize('seller'), asyncHandler(analyticsController.getInventoryForecast));
router.get('/products', protect, authorize('seller'), asyncHandler(analyticsController.getProductAnalytics));

// Admin Analytics Routes
router.get('/admin/sales', protect, authorize('admin'), asyncHandler(analyticsController.getAdminSalesAnalytics));
router.get('/admin/customers', protect, authorize('admin'), asyncHandler(analyticsController.getAdminCustomerAnalytics));
router.get('/admin/products', protect, authorize('admin'), asyncHandler(analyticsController.getAdminProductAnalytics));

export default router;
