import { query, isUuid } from '../db/index.js';
import { toUser, toProduct } from '../db/mappers.js';
import { BaseController } from './BaseController.js';

class UserController extends BaseController {
    // @desc    Add product to wishlist
    // @route   POST /api/users/wishlist/:productId
    // @access  Private
    addToWishlist = async (req, res) => {
        const productId = req.params.productId;
        if (!isUuid(productId)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { rows } = await query(
            `UPDATE users
             SET wishlist = array_append(wishlist, $1::uuid)
             WHERE id = $2 AND NOT (wishlist @> ARRAY[$1::uuid])
             RETURNING *`,
            [productId, req.user._id]
        );

        if (rows.length === 0) {
            // Either the user row is gone, or the product is already listed
            const current = await query('SELECT wishlist FROM users WHERE id = $1', [
                req.user._id,
            ]);
            if (current.rows.length === 0) {
                return res
                    .status(404)
                    .json({ success: false, message: 'User not found' });
            }
            if (current.rows[0].wishlist.includes(productId)) {
                return res
                    .status(400)
                    .json({ success: false, message: 'Product already in wishlist' });
            }
            return res
                .status(404)
                .json({ success: false, message: 'Product not found' });
        }

        this.handleSuccess(res, { wishlist: toUser(rows[0], { lite: true }).wishlist }, 200);
    };

    // @desc    Remove product from wishlist
    // @route   DELETE /api/users/wishlist/:productId
    // @access  Private
    removeFromWishlist = async (req, res) => {
        const productId = req.params.productId;
        if (!isUuid(productId)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { rows } = await query(
            `UPDATE users
             SET wishlist = array_remove(wishlist, $1::uuid)
             WHERE id = $2
             RETURNING *`,
            [productId, req.user._id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        this.handleSuccess(res, { wishlist: toUser(rows[0], { lite: true }).wishlist }, 200);
    };

    // @desc    Get user wishlist
    // @route   GET /api/users/wishlist
    // @access  Private
    getWishlist = async (req, res) => {
        const { rows } = await query('SELECT wishlist FROM users WHERE id = $1', [
            req.user._id,
        ]);
        const ids = rows[0]?.wishlist ?? [];

        // populate() equivalent — one query for the whole list
        const products =
            ids.length > 0
                ? (
                      await query(
                          'SELECT * FROM products WHERE id = ANY($1::uuid[])',
                          [ids]
                      )
                  ).rows
                : [];

        // Preserve wishlist ordering from the user document
        const byId = new Map(products.map((p) => [p.id, p]));
        const wishlist = ids.map((id) => byId.get(id)).filter(Boolean).map((p) => toProduct(p));

        this.handleSuccess(res, { wishlist }, 200);
    };

    // @desc    Add to recently viewed
    // @route   POST /api/users/recently-viewed/:productId
    // @access  Private
    addToRecentlyViewed = async (req, res) => {
        const productId = req.params.productId;
        if (!isUuid(productId)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Read-modify-write (same semantics as the old Mongoose version):
        // drop any existing entry for this product, push it to the front, cap at 10.
        const current = await query(
            'SELECT recently_viewed FROM users WHERE id = $1',
            [req.user._id]
        );
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const entries = (current.rows[0].recently_viewed ?? [])
            .filter((e) => e.product !== productId)
            .slice(0, 9);
        entries.unshift({ product: productId, viewedAt: new Date().toISOString() });

        const { rows } = await query(
            `UPDATE users SET recently_viewed = $1 WHERE id = $2 RETURNING recently_viewed`,
            [JSON.stringify(entries), req.user._id]
        );

        this.handleSuccess(res, { recentlyViewed: rows[0].recently_viewed }, 200);
    };

    // @desc    Get recently viewed
    // @route   GET /api/users/recently-viewed
    // @access  Private
    getRecentlyViewed = async (req, res) => {
        const { rows } = await query(
            'SELECT recently_viewed FROM users WHERE id = $1',
            [req.user._id]
        );
        const entries = rows[0]?.recently_viewed ?? [];
        const ids = entries.map((e) => e.product).filter(Boolean);

        const products =
            ids.length > 0
                ? (
                      await query(
                          `SELECT id, name, price, images, rating, review_count
                           FROM products WHERE id = ANY($1::uuid[])`,
                          [ids]
                      )
                  ).rows
                : [];

        const byId = new Map(
            products.map((p) => [
                p.id,
                {
                    _id: p.id,
                    name: p.name,
                    price: p.price,
                    images: p.images,
                    rating: p.rating,
                    reviewCount: p.review_count,
                },
            ])
        );

        const recentlyViewed = entries
            .map((e) => ({
                product: byId.get(e.product) ?? null,
                viewedAt: e.viewedAt,
            }))
            .filter((e) => e.product);

        this.handleSuccess(res, { recentlyViewed }, 200);
    };
}

export default new UserController();
