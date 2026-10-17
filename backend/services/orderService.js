/**
 * orderService.js — business logic for order operations (Postgres):
 *   - Price and stock verification
 *   - Bulk discount calculation
 *   - Targeted status updates
 *
 * Exported names/signatures are unchanged from the Mongoose version.
 *
 * Architecture:  Routes → Controllers → Services → (Repositories → DB)
 */

import { query } from '../db/index.js';
import { toOrder } from '../db/mappers.js';

// ── Price & Stock verification ─────────────────────────────────────────────────

/**
 * Given an array of order item inputs, batch-fetch the corresponding products
 * and verify stock + price for each.
 *
 * @param {Array<{ product: string, quantity: number, price: number }>} items
 * @returns {Promise<{ verified: Array, errors: Array<string> }>}
 */
export const verifyOrderItems = async (items) => {
    const ids = items.map((i) => i.product);
    const { rows } = ids.length
        ? await query('SELECT * FROM products WHERE id = ANY($1::uuid[])', [ids])
        : { rows: [] };
    const productMap = new Map(rows.map((p) => [p.id, p]));

    const errors = [];
    const verified = [];

    for (const item of items) {
        const product = productMap.get(item.product);

        if (!product) {
            errors.push(`Product ${item.product} not found`);
            continue;
        }
        if (!product.is_active) {
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
 * @param {{ bulkDiscounts?: Array<{quantity:number, discountPercentage:number}> }} product
 * @param {number} quantity
 * @returns {number} discount percentage (0–100)
 */
export const getBulkDiscountPercentage = (product, quantity) => {
    const tiers = product?.bulkDiscounts ?? product?.bulk_discounts ?? [];
    if (!tiers.length) return 0;

    const applicable = tiers
        .filter((d) => quantity >= d.quantity)
        .sort((a, b) => b.discountPercentage - a.discountPercentage);

    return applicable[0]?.discountPercentage ?? 0;
};

// ── Targeted status updates ────────────────────────────────────────────────────

/**
 * Update an order's status (and optional fields) with a single UPDATE.
 *
 * @param {string} orderId
 * @param {{ status?: string, deliveredAt?: Date, paymentStatus?: string }} fields
 * @returns {Promise<Object|null>} API-shaped order, or null when not found
 */
export const updateOrderFields = async (orderId, fields) => {
    const sets = [];
    const vals = [];
    const push = (column, value) => {
        vals.push(value);
        sets.push(`${column} = $${vals.length}`);
    };

    if (fields.status !== undefined) push('status', fields.status);
    if (fields.paymentStatus !== undefined) push('payment_status', fields.paymentStatus);
    if (fields.deliveredAt !== undefined) push('delivered_at', fields.deliveredAt);

    if (sets.length === 0) {
        const { rows } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
        return rows[0] ? toOrder(rows[0]) : null;
    }

    vals.push(orderId);
    const { rows } = await query(
        `UPDATE orders SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
        vals
    );
    return rows[0] ? toOrder(rows[0]) : null;
};
