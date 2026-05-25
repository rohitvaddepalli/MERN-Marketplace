/**
 * orderService.js
 *
 * Business logic for order operations:
 *   - Price and stock verification
 *   - Bulk discount calculation
 *   - Status transition helpers
 *
 * NOTE: Skeleton created as part of the P1 service-layer migration.
 * Business logic is migrated here incrementally from orderController.js.
 *
 * Architecture:  Routes → Controllers → Services → (Repositories → DB)
 */

import Product from '../models/Product.js';
import Order from '../models/Order.js';

// ── Price & Stock verification ─────────────────────────────────────────────────

/**
 * Given an array of order item inputs, batch-fetch the corresponding products
 * and verify stock + price for each.
 *
 * @param {Array<{ product: string, quantity: number, price: number }>} items
 * @returns {Promise<{ verified: Array, errors: Array<string> }>}
 */
export const verifyOrderItems = async (items) => {
    const itemIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: itemIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const errors = [];
    const verified = [];

    for (const item of items) {
        const product = productMap.get(item.product.toString());

        if (!product) {
            errors.push(`Product ${item.product} not found`);
            continue;
        }
        if (!product.isActive) {
            errors.push(`Product "${product.name}" is no longer available`);
            continue;
        }
        if (product.stock < item.quantity) {
            errors.push(
                `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`
            );
            continue;
        }

        verified.push({ item, product });
    }

    return { verified, errors };
};

// ── Bulk discount calculation ──────────────────────────────────────────────────

/**
 * Apply the product's bulk discount tiers to a given quantity.
 * Returns the best (largest) applicable discount percentage, or 0.
 *
 * @param {import('../models/Product.js').default} product
 * @param {number} quantity
 * @returns {number} discount percentage (0–100)
 */
export const getBulkDiscountPercentage = (product, quantity) => {
    if (!product.bulkDiscounts?.length) return 0;

    const applicable = product.bulkDiscounts
        .filter((d) => quantity >= d.quantity)
        .sort((a, b) => b.discountPercentage - a.discountPercentage);

    return applicable[0]?.discountPercentage ?? 0;
};

// ── Targeted status updates ────────────────────────────────────────────────────

/**
 * Update an order's status using a targeted $set — avoids revalidating and
 * re-serialising the full document (P2 fix for cancelOrder / updateOrderStatus).
 *
 * @param {string} orderId
 * @param {{ status?: string, deliveredAt?: Date, paymentStatus?: string }} fields
 * @returns {Promise<import('../models/Order.js').default | null>}
 */
export const updateOrderFields = (orderId, fields) =>
    Order.findByIdAndUpdate(orderId, { $set: fields }, { new: true });
