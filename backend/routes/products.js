import express from 'express';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getMyProducts,
    getFeaturedProducts,
    getLowStockProducts,
    bulkImportProducts,
    exportProducts,
} from '../controllers/productController.js';
import {
    createReview,
    getProductReviews,
    markReviewHelpful,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createProductLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        success: false,
        message: 'Too many products created from this IP, please try again later',
    },
});

const validateProduct = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    validate,
];

const validateReview = [
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    validate,
];

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Get featured products (top 8 by rating)
 *     responses:
 *       200: { description: Featured products list }
 */
router.get('/featured', getFeaturedProducts);
router.get('/my/products', protect, authorize('seller'), getMyProducts);
router.get('/low-stock', protect, authorize('seller'), getLowStockProducts);
router.get('/export', protect, authorize('seller'), exportProducts);
router.post('/bulk-import', protect, authorize('seller'), bulkImportProducts);

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
router.route('/:id/reviews').post(protect, validateReview, createReview).get(getProductReviews);

router.put('/:id/reviews/:reviewId/helpful', protect, markReviewHelpful);

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
    .get(getProducts)
    .post(protect, authorize('seller'), createProductLimiter, validateProduct, createProduct);

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
    .get(getProduct)
    .put(protect, authorize('seller'), validateProduct, updateProduct)
    .delete(protect, authorize('seller'), deleteProduct);

export default router;
