import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrder,
    updateOrderStatus,
    getSellerOrders,
    getAllOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('customer'), createOrder)
    .get(protect, getAllOrders);

router.get('/myorders', protect, authorize('customer'), getMyOrders);
router.get('/seller/orders', protect, authorize('seller'), getSellerOrders);

router.route('/:id')
    .get(protect, getOrder);

router.put('/:id/status', protect, authorize('seller'), updateOrderStatus);

export default router;
