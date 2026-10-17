/**
 * analyticsService.js — reusable helpers for analytics aggregation (Postgres).
 *
 * The Mongo pipeline builders ($lookup / $group) are gone: order_items stores
 * seller_id directly, so a plain join replaces unwind+lookup. Exported helper
 * names that controllers/tests rely on are preserved where they still make
 * sense; the pipeline builder (`sellerItemStages`) became a SQL fragment
 * constant since no SQL query needs building at runtime any more.
 *
 * Architecture:  Routes → Controllers → Services → (Repositories → DB)
 */

import { query } from '../db/index.js';

/**
 * SQL predicate matching the old `sellerItemStages()` idea: order items that
 * belong to a specific seller. `order_items.seller_id` makes the old
 * $unwind → $lookup(products) → $match(seller) chain unnecessary.
 */
export const SELLER_ITEM_WHERE = 'oi.seller_id = $1';

// ── Sales velocity ────────────────────────────────────────────────────────────

/**
 * Return a map of { productId → totalUnitsSold } over a date range.
 *
 * @param {string} sellerId
 * @param {string[]} productIds  - pre-fetched IDs (avoids an extra DB call)
 * @param {Date}    startDate
 * @returns {Promise<Map<string, number>>}
 */
export const getSalesVelocityMap = async (sellerId, productIds, startDate) => {
    if (!productIds || productIds.length === 0) return new Map();

    const { rows } = await query(
        `SELECT oi.product_id, COALESCE(SUM(oi.quantity), 0)::int AS total_sold
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.seller_id = $1
           AND oi.product_id = ANY($2::uuid[])
           AND o.created_at >= $3
         GROUP BY oi.product_id`,
        [sellerId, productIds, startDate]
    );

    const map = new Map();
    rows.forEach((r) => map.set(r.product_id, Number(r.total_sold)));
    return map;
};

// ── Revenue summary ───────────────────────────────────────────────────────────

/**
 * Compute total revenue, order count, and per-day breakdown for a date range.
 *
 * Replaces the old `{ matchStage }` Mongo argument with an equivalent SQL
 * predicate + bound params (no pipeline stages reach SQL unescaped).
 *
 * @param {{ whereSql?: string, params?: unknown[] }} filter
 * @param {Date} startDate
 * @returns {Promise<Object>} { totalRevenue, totalOrders, averageOrderValue, salesData[] }
 */
export const getRevenueSummary = async (filter = {}, startDate) => {
    const { whereSql = 'true', params = [] } = filter;
    const bind = [startDate, ...params];

    const { rows } = await query(
        `SELECT to_char(created_at, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(total_price), 0)::float AS revenue,
                COUNT(*)::int AS orders
         FROM orders
         WHERE created_at >= $1 AND ${whereSql}
         GROUP BY 1
         ORDER BY 1 ASC`,
        bind
    );

    const salesData = rows.map((r) => ({
        date: r.date,
        revenue: r.revenue,
        orders: r.orders,
    }));
    const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

    return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        salesData,
    };
};
