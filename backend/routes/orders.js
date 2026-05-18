import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrder,
    updateOrderStatus,
    getSellerOrders,
    getAllOrders,
    cancelOrder,
} from '../controllers/orderController.js';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        success: false,
        message: 'Too many orders created from this IP, please try again later',
    },
});

const validateOrder = [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required'),
    body('paymentMethod')
        .isIn(['card', 'paypal', 'cod'])
        .withMessage('Valid payment method is required'),
    validate,
];

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
    .post(optionalProtect, createOrderLimiter, validateOrder, createOrder)
    .get(protect, authorize('admin'), getAllOrders);

router.get('/myorders', protect, authorize('customer'), getMyOrders);
router.get('/seller/orders', protect, authorize('seller'), getSellerOrders);

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
router.route('/:id').get(protect, getOrder);

router.put('/:id/status', protect, authorize('seller'), updateOrderStatus);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);

export default router;
