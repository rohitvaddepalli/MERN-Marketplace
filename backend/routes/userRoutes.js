import express from 'express';
import { protect } from '../middleware/auth.js';
import userController from '../controllers/userController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.route('/wishlist').get(asyncHandler(userController.getWishlist));

router.route('/wishlist/:productId')
    .post(asyncHandler(userController.addToWishlist))
    .delete(asyncHandler(userController.removeFromWishlist));

router.route('/recently-viewed').get(asyncHandler(userController.getRecentlyViewed));

router.route('/recently-viewed/:productId')
    .post(asyncHandler(userController.addToRecentlyViewed));

export default router;
