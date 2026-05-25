import express from 'express';
import productController from '../controllers/productController.js';
import reviewController from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { validateZod } from '../middleware/validateZod.js';
import { productSchema, reviewSchema } from '../validators/productValidator.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

const createProductLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        success: false,
        message: 'Too many products created from this IP, please try again later',
    },
});

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Get featured products (top 8 by rating)
 *     responses:
 *       200: { description: Featured products list }
 */
router.get('/featured', asyncHandler(productController.getFeaturedProducts));
router.get('/my/products', protect, authorize('seller'), asyncHandler(productController.getMyProducts));
router.get('/low-stock', protect, authorize('seller'), asyncHandler(productController.getLowStockProducts));
router.get('/export', protect, authorize('seller'), productController.exportProducts); // no asyncHandler for streaming
router.post('/bulk-import', protect, authorize('seller'), asyncHandler(productController.bulkImportProducts));

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     tags: [Products]
 *     summary: Get reviews for a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reviews list }
 *   post:
 *     tags: [Products]
 *     summary: Create a review (authenticated)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, comment]
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Review created }
 */
router.route('/:id/reviews')
    .post(protect, validateZod(reviewSchema), asyncHandler(reviewController.createReview))
    .get(asyncHandler(reviewController.getProductReviews));

router.put('/:id/reviews/:reviewId/helpful', protect, asyncHandler(reviewController.markReviewHelpful));

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List active products with filters and pagination
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price-asc, price-desc, rating] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *     responses:
 *       200: { description: Products list with pagination }
 *   post:
 *     tags: [Products]
 *     summary: Create a product (seller only)
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, stock, category]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: integer }
 *               category: { type: string }
 *     responses:
 *       201: { description: Product created }
 */
router
    .route('/')
    .get(asyncHandler(productController.getProducts))
    .post(protect, authorize('seller'), createProductLimiter, validateZod(productSchema), asyncHandler(productController.createProduct));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get single product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product detail }
 *       404: { description: Product not found }
 *   put:
 *     tags: [Products]
 *     summary: Update product (owner only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product updated }
 *       403: { description: Not authorized }
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (owner only)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product deleted }
 *       403: { description: Not authorized }
 */
router
    .route('/:id')
    .get(asyncHandler(productController.getProduct))
    .put(protect, authorize('seller'), validateZod(productSchema), asyncHandler(productController.updateProduct))
    .delete(protect, authorize('seller'), asyncHandler(productController.deleteProduct));

export default router;
