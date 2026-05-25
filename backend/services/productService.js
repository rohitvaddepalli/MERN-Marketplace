/**
 * productService.js
 *
 * Business logic for product operations.
 * Controllers import from here; they never talk to Mongoose models directly.
 *
 * NOTE: This is the initial skeleton created as part of the P1 service-layer
 * migration.  Move controller logic here incrementally, one function at a time,
 * with a matching unit test before each move.
 *
 * Architecture:  Routes → Controllers → Services → (Repositories → DB)
 * Current state: business logic still lives in productController.js
 *                — migrate here function-by-function in P2/P3 sprints.
 */

import Product from '../models/Product.js';

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch a single product by ID.
 * @param {string} productId
 * @returns {Promise<import('../models/Product.js').default | null>}
 */
export const getProductById = (productId) => Product.findById(productId);

/**
 * Check whether a product belongs to a given seller.
 * @param {string} productId
 * @param {string} sellerId
 * @returns {Promise<boolean>}
 */
export const isProductOwnedBySeller = async (productId, sellerId) => {
    const product = await Product.findById(productId).select('seller');
    if (!product) return false;
    return product.seller.toString() === sellerId.toString();
};

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Create a new product.
 * @param {Object} data - Fields matching the Product schema
 * @returns {Promise<import('../models/Product.js').default>}
 */
export const createProduct = (data) => Product.create(data);

/**
 * Update a product using a single atomic query that also verifies ownership.
 * Returns null if the product does not exist or is not owned by the seller.
 *
 * @param {string} productId
 * @param {string} sellerId
 * @param {Object} updates
 * @returns {Promise<import('../models/Product.js').default | null>}
 */
export const updateProductBySeller = (productId, sellerId, updates) =>
    Product.findOneAndUpdate({ _id: productId, seller: sellerId }, updates, {
        new: true,
        runValidators: true,
    });

/**
 * Soft-delete a product (set isActive = false) while verifying seller ownership.
 * @param {string} productId
 * @param {string} sellerId
 * @returns {Promise<import('../models/Product.js').default | null>}
 */
export const deactivateProductBySeller = (productId, sellerId) =>
    Product.findOneAndUpdate({ _id: productId, seller: sellerId }, { isActive: false }, { new: true });
