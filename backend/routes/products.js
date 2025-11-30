import express from 'express';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getMyProducts,
    getFeaturedProducts
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/my/products', protect, authorize('seller'), getMyProducts);

router.route('/')
    .get(getProducts)
    .post(protect, authorize('seller'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('seller'), updateProduct)
    .delete(protect, authorize('seller'), deleteProduct);

export default router;
