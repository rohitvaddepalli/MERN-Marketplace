import { query, isUuid } from '../db/index.js';
import { toReview } from '../db/mappers.js';
import { BaseController } from './BaseController.js';

/**
 * Recalculate a product's aggregate rating — the port of the old
 * Review.calcAverageRating() post-save hook (hooks don't exist without
 * Mongoose, so controllers call this explicitly after every review change).
 */
const recalcProductRating = async (productId) => {
    await query(
        `UPDATE products p
         SET rating = COALESCE(agg.avg_rating, 0),
             review_count = COALESCE(agg.n_rating, 0),
             updated_at = now()
         FROM (
            SELECT AVG(rating)::float AS avg_rating, COUNT(*)::int AS n_rating
            FROM reviews WHERE product_id = $1
         ) agg
         WHERE p.id = $1`,
        [productId]
    );
};

class ReviewController extends BaseController {
    // @desc    Create new review
    // @route   POST /api/products/:id/reviews
    // @access  Private
    createReview = async (req, res) => {
        const { rating, comment, media = [] } = req.body;
        const productId = req.params.id;

        if (!isUuid(productId)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = await query('SELECT id FROM products WHERE id = $1', [productId]);
        if (product.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const alreadyReviewed = await query(
            'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
            [req.user._id, productId]
        );
        if (alreadyReviewed.rows.length > 0) {
            return res
                .status(400)
                .json({ success: false, message: 'Product already reviewed' });
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
                return res.status(400).json({
                    success: false,
                    message:
                        'Each media item must have a valid url and type (image or video)',
                });
            }
        }

        // Check if user has purchased this product (verified purchase)
        const verifiedOrder = await query(
            `SELECT 1 FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.customer_id = $1 AND oi.product_id = $2
               AND o.status IN ('delivered', 'completed')
             LIMIT 1`,
            [req.user._id, productId]
        );

        const { rows } = await query(
            `INSERT INTO reviews (user_id, product_id, rating, comment, media, is_verified_purchase)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                req.user._id,
                productId,
                Number(rating),
                comment,
                JSON.stringify(media),
                verifiedOrder.rows.length > 0,
            ]
        );

        // Was the post('save') hook — keeps product rating tiles fresh
        await recalcProductRating(productId);

        this.handleSuccess(res, { review: toReview(rows[0]) }, 201);
    };

    // @desc    Get product reviews
    // @route   GET /api/products/:id/reviews
    // @access  Public
    getProductReviews = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return this.handleSuccess(res, { count: 0, reviews: [] }, 200);
        }

        const { rows } = await query(
            `SELECT rv.*, u.name AS user_name, u.avatar AS user_avatar
             FROM reviews rv
             JOIN users u ON u.id = rv.user_id
             WHERE rv.product_id = $1
             ORDER BY rv.created_at DESC`,
            [req.params.id]
        );

        this.handleSuccess(
            res,
            { count: rows.length, reviews: rows.map((r) => toReview(r)) },
            200
        );
    };

    // @desc    Vote a review as helpful
    // @route   PUT /api/products/:id/reviews/:reviewId/helpful
    // @access  Private
    markReviewHelpful = async (req, res) => {
        if (!isUuid(req.params.reviewId)) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const { rows } = await query(
            `UPDATE reviews SET helpful_votes = helpful_votes + 1
             WHERE id = $1
             RETURNING helpful_votes`,
            [req.params.reviewId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        this.handleSuccess(res, { helpfulVotes: rows[0].helpful_votes }, 200);
    };
}

export default new ReviewController();
