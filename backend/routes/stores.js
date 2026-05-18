import express from 'express';
import {
    createStore,
    getStores,
    getStore,
    updateStore,
    deleteStore,
    getMyStore,
} from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const validateStore = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('address').optional().isObject(),
    body('contact').optional().isObject(),
    validate,
];

/**
 * @swagger
 * /api/stores:
 *   get:
 *     tags: [Stores]
 *     summary: List all active stores
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Stores list }
 *   post:
 *     tags: [Stores]
 *     summary: Create a store (seller only)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, category]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               address: { type: object }
 *               contact: { type: object }
 *     responses:
 *       201: { description: Store created }
 *       400: { description: Seller already has a store }
 */
router.route('/').get(getStores).post(protect, authorize('seller'), validateStore, createStore);

router.get('/my/store', protect, authorize('seller'), getMyStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     tags: [Stores]
 *     summary: Get store by ID with its products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Store with products }
 *       404: { description: Store not found }
 *   put:
 *     tags: [Stores]
 *     summary: Update store (owner only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Store updated }
 *       403: { description: Not authorized }
 *   delete:
 *     tags: [Stores]
 *     summary: Delete store (owner only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Store deleted }
 *       403: { description: Not authorized }
 */
router
    .route('/:id')
    .get(getStore)
    .put(protect, authorize('seller'), validateStore, updateStore)
    .delete(protect, authorize('seller'), deleteStore);

export default router;
