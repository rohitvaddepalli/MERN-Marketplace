import express from 'express';
import storeController from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateZod } from '../middleware/validateZod.js';
import { storeSchema } from '../validators/storeValidator.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

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
router.route('/')
    .get(asyncHandler(storeController.getStores))
    .post(protect, authorize('seller'), validateZod(storeSchema), asyncHandler(storeController.createStore));

router.get('/my/store', protect, authorize('seller'), asyncHandler(storeController.getMyStore));

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
    .get(asyncHandler(storeController.getStore))
    .put(protect, authorize('seller'), validateZod(storeSchema), asyncHandler(storeController.updateStore))
    .delete(protect, authorize('seller'), asyncHandler(storeController.deleteStore));

export default router;
