import express from 'express';
import {
    getSalesAnalytics,
    getCustomerAnalytics,
    getInventoryForecast,
    getProductAnalytics
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/sales', protect, authorize('seller'), getSalesAnalytics);
router.get('/customers', protect, authorize('seller'), getCustomerAnalytics);
router.get('/inventory-forecast', protect, authorize('seller'), getInventoryForecast);
router.get('/products', protect, authorize('seller'), getProductAnalytics);

export default router;
