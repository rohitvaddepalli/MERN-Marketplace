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
    exportProducts
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/my/products', protect, authorize('seller'), getMyProducts);
router.get('/low-stock', protect, authorize('seller'), getLowStockProducts);
router.get('/export', protect, authorize('seller'), exportProducts);
router.post('/bulk-import', protect, authorize('seller'), bulkImportProducts);

router.route('/')
    .get(getProducts)
    .post(protect, authorize('seller'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('seller'), updateProduct)
    .delete(protect, authorize('seller'), deleteProduct);

export default router;

