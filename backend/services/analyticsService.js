/**
 * analyticsService.js
 *
 * Reusable helpers for analytics aggregation pipelines.
 * Both seller and admin analytics controllers import from here.
 *
 * NOTE: Skeleton created as part of the P1 service-layer migration.
 * Full migration of analyticsController.js pipelines is a P2/P3 sprint item.
 *
 * Architecture:  Routes → Controllers → Services → (Repositories → DB)
 */

import Order from '../models/Order.js';
import Product from '../models/Product.js';

// ── Shared pipeline builders ──────────────────────────────────────────────────

/**
 * Build an aggregation pipeline stage array that filters order items to those
 * belonging to a specific seller.
 *
 * Strategy: $lookup on products then $match on seller — no preliminary
 * Product.find() needed.  The result is one document per matching item.
 *
 * @returns {Array<Object>} MongoDB aggregation stages
 */
export const sellerItemStages = (sellerId) => [
    { $unwind: '$items' },
    {
        $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: '_product',
        },
    },
    { $unwind: { path: '$_product', preserveNullAndEmptyArrays: false } },
    { $match: { '_product.seller': sellerId } },
];

// ── Sales velocity ────────────────────────────────────────────────────────────

/**
 * Return a map of { productId → totalUnitsSold } for a seller over a date range.
 *
 * @param {string|ObjectId} sellerId
 * @param {string[]} productIds  - pre-fetched IDs (avoids an extra DB call)
 * @param {Date}    startDate
 * @returns {Promise<Map<string, number>>}
 */
export const getSalesVelocityMap = async (sellerId, productIds, startDate) => {
    const rows = await Order.aggregate([
        {
            $match: {
                'items.product': { $in: productIds },
                createdAt: { $gte: startDate },
            },
        },
        { $unwind: '$items' },
        { $match: { 'items.product': { $in: productIds } } },
        {
            $group: {
                _id: '$items.product',
                totalSold: { $sum: '$items.quantity' },
            },
        },
    ]);

    const map = new Map();
    rows.forEach(({ _id, totalSold }) => map.set(_id.toString(), totalSold));
    return map;
};

// ── Revenue summary ───────────────────────────────────────────────────────────

/**
 * Compute total revenue, order count, and per-day breakdown for a date range.
 * Used by both the seller and admin sales analytics endpoints.
 *
 * @param {Object}  matchStage  - Extra $match conditions (e.g. seller filter or status)
 * @param {Date}    startDate
 * @returns {Promise<Object>} { totalRevenue, totalOrders, averageOrderValue, salesData[] }
 */
export const getRevenueSummary = async (matchStage, startDate) => {
    const [result] = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, ...matchStage } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $group: {
                _id: null,
                salesData: { $push: { date: '$_id', revenue: '$revenue', orders: '$orders' } },
                totalRevenue: { $sum: '$revenue' },
                totalOrders: { $sum: '$orders' },
            },
        },
        {
            $project: {
                _id: 0,
                salesData: 1,
                totalRevenue: 1,
                totalOrders: 1,
                averageOrderValue: {
                    $cond: [
                        { $gt: ['$totalOrders', 0] },
                        { $divide: ['$totalRevenue', '$totalOrders'] },
                        0,
                    ],
                },
            },
        },
    ]);

    return result ?? { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, salesData: [] };
};
