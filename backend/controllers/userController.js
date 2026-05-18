import User from '../models/User.js';

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.productId;

        user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
        await user.save();

        res.status(200).json({
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');

        res.status(200).json({
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Add to recently viewed
// @route   POST /api/users/recently-viewed/:productId
// @access  Private
export const addToRecentlyViewed = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            recentlyViewed: user.recentlyViewed,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get recently viewed
// @route   GET /api/users/recently-viewed
// @access  Private
export const getRecentlyViewed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'recentlyViewed.product',
            select: 'name price images rating reviewCount',
        });

        res.status(200).json({
            success: true,
            recentlyViewed: user.recentlyViewed,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
