import User from '../models/User.js';
import { BaseController } from './BaseController.js';

class UserController extends BaseController {
    // @desc    Add product to wishlist
    // @route   POST /api/users/wishlist/:productId
    // @access  Private
    addToWishlist = async (req, res) => {
        const user = await User.findById(req.user._id);
        const productId = req.params.productId;

        if (user.wishlist.includes(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist',
            });
        }

        user.wishlist.push(productId);
        await user.save();

        this.handleSuccess(res, { wishlist: user.wishlist }, 200);
    };

    // @desc    Remove product from wishlist
    // @route   DELETE /api/users/wishlist/:productId
    // @access  Private
    removeFromWishlist = async (req, res) => {
        const user = await User.findById(req.user._id);
        const productId = req.params.productId;

        user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
        await user.save();

        this.handleSuccess(res, { wishlist: user.wishlist }, 200);
    };

    // @desc    Get user wishlist
    // @route   GET /api/users/wishlist
    // @access  Private
    getWishlist = async (req, res) => {
        const user = await User.findById(req.user._id).populate('wishlist');

        this.handleSuccess(res, { wishlist: user.wishlist }, 200);
    };

    // @desc    Add to recently viewed
    // @route   POST /api/users/recently-viewed/:productId
    // @access  Private
    addToRecentlyViewed = async (req, res) => {
        const user = await User.findById(req.user._id);
        const productId = req.params.productId;

        // Remove if already exists to push to top
        user.recentlyViewed = user.recentlyViewed.filter(
            (item) => item.product.toString() !== productId.toString()
        );

        user.recentlyViewed.unshift({ product: productId });

        // Limit to 10 items
        if (user.recentlyViewed.length > 10) {
            user.recentlyViewed.pop();
        }

        await user.save();

        this.handleSuccess(res, { recentlyViewed: user.recentlyViewed }, 200);
    };

    // @desc    Get recently viewed
    // @route   GET /api/users/recently-viewed
    // @access  Private
    getRecentlyViewed = async (req, res) => {
        const user = await User.findById(req.user._id).populate({
            path: 'recentlyViewed.product',
            select: 'name price images rating reviewCount',
        });

        this.handleSuccess(res, { recentlyViewed: user.recentlyViewed }, 200);
    };
}

export default new UserController();
