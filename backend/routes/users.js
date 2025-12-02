import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    addToRecentlyViewed,
    getRecentlyViewed
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.route('/wishlist')
    .get(getWishlist);

router.route('/wishlist/:productId')
    .post(addToWishlist)
    .delete(removeFromWishlist);

router.route('/recently-viewed')
    .get(getRecentlyViewed);

router.route('/recently-viewed/:productId')
    .post(addToRecentlyViewed);

export default router;
