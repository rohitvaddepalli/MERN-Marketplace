import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createReview = async (req, res) => {
    try {
        const { rating, comment, media = [] } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const alreadyReviewed = await Review.findOne({
            user: req.user._id,
            product: productId,
        });
        if (alreadyReviewed) {
            return res.status(400).json({ success: false, message: 'Product already reviewed' });
        }

        // Validate media entries
        if (!Array.isArray(media) || media.length > 5) {
            return res
                .status(400)
                .json({ success: false, message: 'Media must be an array of at most 5 items' });
        }
        const allowedTypes = ['image', 'video'];
        for (const item of media) {
            if (!item.url || !item.type || !allowedTypes.includes(item.type)) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Each media item must have a valid url and type (image or video)',
                    });
            }
        }

        // Check if user has purchased this product (verified purchase)
        const verifiedOrder = await Order.findOne({
            customer: req.user._id,
            'items.product': productId,
            status: { $in: ['delivered', 'completed'] },
        });

        const review = await Review.create({
            user: req.user._id,
            product: productId,
            rating: Number(rating),
            comment,
            media,
            isVerifiedPurchase: !!verifiedOrder,
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id })
            .populate('user', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Vote a review as helpful
// @route   PUT /api/products/:id/reviews/:reviewId/helpful
// @access  Private
export const markReviewHelpful = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        review.helpfulVotes += 1;
        await review.save();
        res.status(200).json({ success: true, helpfulVotes: review.helpfulVotes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
