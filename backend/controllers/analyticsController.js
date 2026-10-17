import { query } from '../db/index.js';
import cache from '../utils/cache.js';
import { BaseController } from './BaseController.js';

const CACHE_TTL = 5 * 60; // 5 minutes

/**
 * The Mongo pipelines ($unwind + $lookup + $group) map to plain SQL joins over
 * order_items, which now stores seller_id directly — no unwind required.
 */
class AnalyticsController extends BaseController {
    // ── Seller analytics ──────────────────────────────────────────────────────────

    // @desc    Get sales analytics
    // @route   GET /api/analytics/sales
    // @access  Private/Seller
    getSalesAnalytics = async (req, res) => {
        const { period = '30' } = req.query;
        const days = Math.min(parseInt(period) || 30, 365); // cap at 1 year
        const sellerId = req.user._id;
        const cacheKey = `analytics:sales:${sellerId}:${days}`;

        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { rows } = await query(
            `SELECT to_char(o.created_at, 'YYYY-MM-DD') AS date,
                    COALESCE(SUM(oi.price * oi.quantity), 0)::float AS revenue,
                    COUNT(*)::int AS orders
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.created_at >= $1
               AND oi.seller_id = $2
             GROUP BY 1
             ORDER BY 1 ASC`,
            [startDate, sellerId]
        );

        const salesData = rows.map((r) => ({
            date: r.date,
            revenue: r.revenue,
            orders: r.orders,
        }));
        const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
        const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

        const analytics = {
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            salesData,
        };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };

    // @desc    Get customer behavior analytics
    // @route   GET /api/analytics/customers
    // @access  Private/Seller
    getCustomerAnalytics = async (req, res) => {
        const sellerId = req.user._id;
        const cacheKey = `analytics:customers:${sellerId}`;

        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const { rows } = await query(
            `SELECT u.name, u.email,
                    COUNT(DISTINCT o.id)::int AS total_orders,
                    COALESCE(SUM(oi.price * oi.quantity), 0)::float AS total_spent,
                    MAX(o.created_at) AS last_order_date
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             JOIN users u ON u.id = o.customer_id
             WHERE oi.seller_id = $1 AND o.customer_id IS NOT NULL
             GROUP BY u.id, u.name, u.email
             ORDER BY total_spent DESC`,
            [sellerId]
        );

        const customers = rows.map((r) => ({
            name: r.name,
            email: r.email,
            totalOrders: r.total_orders,
            totalSpent: r.total_spent,
            lastOrderDate: r.last_order_date,
        }));

        const totalCustomers = customers.length;
        const topCustomers = customers.slice(0, 10);
        const repeatCustomerRate =
            totalCustomers > 0
                ? (customers.filter((c) => c.totalOrders > 1).length / totalCustomers) * 100
                : 0;

        const analytics = { totalCustomers, topCustomers, repeatCustomerRate };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };

    // @desc    Get inventory forecasting
    // @route   GET /api/analytics/inventory-forecast
    // @access  Private/Seller
    getInventoryForecast = async (req, res) => {
        const { days = 30 } = req.query;
        const forecastDays = Math.min(parseInt(days) || 30, 365);
        const sellerId = req.user._id;
        const cacheKey = `analytics:forecast:${sellerId}:${forecastDays}`;

        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { forecast: cached.forecast }, 200);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - forecastDays);

        // Products + sales velocity in one round-trip (was Product.find + aggregate)
        const { rows } = await query(
            `SELECT p.name, p.stock, p.low_stock_threshold,
                    COALESCE(sold.total_sold, 0)::int AS total_sold
             FROM products p
             LEFT JOIN LATERAL (
                 SELECT SUM(oi.quantity) AS total_sold
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                 WHERE oi.product_id = p.id
                   AND oi.seller_id = $1
                   AND o.created_at >= $2
             ) sold ON true
             WHERE p.seller_id = $1
             ORDER BY p.stock ASC`,
            [sellerId, startDate]
        );

        const forecast = rows
            .map((p) => {
                const totalSold = Number(p.total_sold) || 0;
                const averageDailySales = totalSold / forecastDays;
                const daysUntilStockout =
                    averageDailySales > 0 ? Math.floor(p.stock / averageDailySales) : Infinity;
                return {
                    name: p.name,
                    currentStock: p.stock,
                    lowStockThreshold: p.low_stock_threshold,
                    totalSold,
                    averageDailySales: Number(averageDailySales.toFixed(2)),
                    daysUntilStockout: isFinite(daysUntilStockout) ? daysUntilStockout : null,
                    reorderRecommended:
                        daysUntilStockout < 14 || p.stock <= p.low_stock_threshold,
                };
            })
            .sort((a, b) => (a.daysUntilStockout ?? Infinity) - (b.daysUntilStockout ?? Infinity));

        await cache.set(cacheKey, { forecast }, CACHE_TTL);
        this.handleSuccess(res, { forecast }, 200);
    };

    // @desc    Get product performance analytics
    // @route   GET /api/analytics/products
    // @access  Private/Seller
    getProductAnalytics = async (req, res) => {
        const sellerId = req.user._id;
        const cacheKey = `analytics:products:${sellerId}`;

        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const { rows } = await query(
            `SELECT p.name, p.category, p.price, p.stock,
                    COALESCE(SUM(oi.quantity), 0)::int AS total_sold,
                    COALESCE(SUM(oi.price * oi.quantity), 0)::float AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE oi.seller_id = $1
             GROUP BY p.id, p.name, p.category, p.price, p.stock
             ORDER BY revenue DESC`,
            [sellerId]
        );

        const productPerformance = rows.map((r) => ({
            name: r.name,
            category: r.category,
            price: r.price,
            stock: r.stock,
            totalSold: r.total_sold,
            revenue: r.revenue,
        }));

        const topProducts = productPerformance.slice(0, 10);

        const categoryPerformance = productPerformance.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = { revenue: 0, unitsSold: 0 };
            acc[p.category].revenue += p.revenue;
            acc[p.category].unitsSold += p.totalSold;
            return acc;
        }, {});

        const analytics = { topProducts, categoryPerformance };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };

    // ── Admin analytics ───────────────────────────────────────────────────────────

    // @desc    Get system-wide sales analytics (Admin)
    // @route   GET /api/analytics/admin/sales
    // @access  Private/Admin
    getAdminSalesAnalytics = async (req, res) => {
        const { period = '30' } = req.query;
        const days = Math.min(parseInt(period) || 30, 365);
        const cacheKey = `analytics:admin:sales:${days}`;

        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Platform revenue per day = tax + shipping + fixed fee (the old
        // pipeline hardcoded +2 here; kept identical on purpose)
        const { rows } = await query(
            `SELECT to_char(created_at, 'YYYY-MM-DD') AS date,
                    SUM(COALESCE(tax_price, 0) + COALESCE(shipping_price, 0) + 2)::float AS revenue,
                    COUNT(*)::int AS orders
             FROM orders
             WHERE (payment_status = 'completed' OR status = 'delivered')
               AND created_at >= $1
             GROUP BY 1
             ORDER BY 1 ASC`,
            [startDate]
        );

        const salesData = rows.map((r) => ({
            date: r.date,
            revenue: r.revenue,
            orders: r.orders,
        }));
        const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
        const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

        const analytics = {
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            salesData,
        };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };

    // @desc    Get system-wide customer analytics (Admin)
    // @route   GET /api/analytics/admin/customers
    // @access  Private/Admin
    getAdminCustomerAnalytics = async (req, res) => {
        const cacheKey = 'analytics:admin:customers';
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const { rows: topRows } = await query(
            `SELECT u.name, u.email,
                    COUNT(o.id)::int AS total_orders,
                    COALESCE(SUM(o.total_price), 0)::float AS total_spent,
                    MAX(o.created_at) AS last_order_date
             FROM orders o
             JOIN users u ON u.id = o.customer_id
             WHERE o.customer_id IS NOT NULL
             GROUP BY u.id, u.name, u.email
             ORDER BY total_spent DESC
             LIMIT 10`
        );

        const { rows: statsRows } = await query(
            `SELECT COUNT(*)::int AS total_customers,
                    COUNT(*) FILTER (WHERE cnt > 1)::int AS repeat_customers
             FROM (
                 SELECT customer_id, COUNT(*) AS cnt
                 FROM orders
                 WHERE customer_id IS NOT NULL
                 GROUP BY customer_id
             ) per_customer`
        );

        const topCustomers = topRows.map((r) => ({
            name: r.name,
            email: r.email,
            totalOrders: r.total_orders,
            totalSpent: r.total_spent,
            lastOrderDate: r.last_order_date,
        }));
        const stats = statsRows[0] ?? { total_customers: 0, repeat_customers: 0 };
        const totalCustomers = stats.total_customers;
        const repeatCustomerRate =
            totalCustomers > 0 ? (stats.repeat_customers / totalCustomers) * 100 : 0;

        const analytics = { totalCustomers, topCustomers, repeatCustomerRate };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };

    // @desc    Get system-wide product analytics (Admin)
    // @route   GET /api/analytics/admin/products
    // @access  Private/Admin
    getAdminProductAnalytics = async (req, res) => {
        const cacheKey = 'analytics:admin:products';
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, { analytics: cached.analytics }, 200);

        const { rows } = await query(
            `SELECT p.name, p.category, p.price, p.stock,
                    COALESCE(SUM(oi.quantity), 0)::int AS total_sold,
                    COALESCE(SUM(oi.price * oi.quantity), 0)::float AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE o.payment_status = 'completed'
             GROUP BY p.id, p.name, p.category, p.price, p.stock
             ORDER BY revenue DESC`
        );

        const productPerformance = rows.map((r) => ({
            name: r.name,
            category: r.category,
            price: r.price,
            stock: r.stock,
            totalSold: r.total_sold,
            revenue: r.revenue,
        }));

        const topProducts = productPerformance.slice(0, 10);
        const categoryPerformance = productPerformance.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = { revenue: 0, unitsSold: 0 };
            acc[p.category].revenue += p.revenue;
            acc[p.category].unitsSold += p.totalSold;
            return acc;
        }, {});

        const analytics = { topProducts, categoryPerformance };
        await cache.set(cacheKey, { analytics }, CACHE_TTL);

        this.handleSuccess(res, { analytics }, 200);
    };
}

export default new AnalyticsController();
