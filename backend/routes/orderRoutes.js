import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { validateZod } from '../middleware/validateZod.js';
import { orderSchema, updateOrderStatusSchema } from '../validators/orderValidator.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

const createOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        success: false,
        message: 'Too many orders created from this IP, please try again later',
    },
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order (authenticated or guest)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress, paymentMethod]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product: { type: string }
 *                     store: { type: string }
 *                     quantity: { type: integer }
 *               shippingAddress: { type: object }
 *               paymentMethod: { type: string, enum: [card, paypal, cod] }
 *     responses:
 *       201: { description: Order created }
 *       400: { description: Validation error }
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (admin only)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Orders list }
 */
router
    .route('/')
    .post(optionalProtect, createOrderLimiter, validateZod(orderSchema), asyncHandler(orderController.createOrder))
    .get(protect, authorize('admin'), asyncHandler(orderController.getAllOrders));

router.get('/myorders', protect, authorize('customer'), asyncHandler(orderController.getMyOrders));
router.get('/seller/orders', protect, authorize('seller'), asyncHandler(orderController.getSellerOrders));

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID (customer or seller)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order detail }
 *       403: { description: Not authorized }
 */
router.route('/:id').get(protect, asyncHandler(orderController.getOrder));

router.put('/:id/status', protect, authorize('seller'), validateZod(updateOrderStatusSchema), asyncHandler(orderController.updateOrderStatus));
router.put('/:id/cancel', protect, authorize('customer'), asyncHandler(orderController.cancelOrder));

export default router;
