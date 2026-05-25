import Order from '../models/Order.js';
import Product from '../models/Product.js';
import cache from '../utils/cache.js';
import { BaseController } from './BaseController.js';

const CACHE_TTL = 5 * 60; // 5 minutes

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

        // PERF: Single-query approach — $lookup resolves seller's products inside
        // the aggregation pipeline so no preliminary Product.find() is needed.
        const [result] = await Order.aggregate([
            // Pre-filter by date before the expensive $unwind
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            // Join product to check seller ownership
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: '_product',
                },
            },
            { $unwind: { path: '$_product', preserveNullAndEmptyArrays: false } },
            // Keep only items belonging to this seller
            { $match: { '_product.seller': sellerId } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $group: {
                    _id: null,
                    salesData: {
                        $push: { date: '$_id', revenue: '$revenue', orders: '$orders' },
                    },
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

        const analytics = result ?? {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            salesData: [],
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

        // PERF: Aggregation-only — $lookup replaces the preliminary Product.find()
        const customers = await Order.aggregate([
            { $unwind: '$items' },
            // Join product to determine seller ownership
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
            {
                $group: {
                    _id: '$customer',
                    totalOrders: { $addToSet: '$_id' },
                    totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    lastOrderDate: { $max: '$createdAt' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerInfo',
                },
            },
            { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    name: '$customerInfo.name',
                    email: '$customerInfo.email',
                    totalOrders: { $size: '$totalOrders' },
                    totalSpent: 1,
                    lastOrderDate: 1,
                },
            },
            { $sort: { totalSpent: -1 } },
        ]);

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

        // PERF: Fetch seller products ONCE — reuse the list for both the
        // aggregation $match and the subsequent forecast calculation loop.
        const products = await Product.find({ seller: sellerId }).select(
            'name stock lowStockThreshold'
        );
        const productIds = products.map((p) => p._id);

        // Sales velocity per product via aggregation
        const salesVelocity = await Order.aggregate([
            {
                $match: {
                    'items.product': { $in: productIds },
                    createdAt: { $gte: startDate },
                },
            },
            { $unwind: '$items' },
            // Filter unwound items to only this seller's products
            { $match: { 'items.product': { $in: productIds } } },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                },
            },
        ]);

        const velocityMap = {};
        salesVelocity.forEach(({ _id, totalSold }) => {
            velocityMap[_id.toString()] = totalSold;
        });
        const forecast = products
            .map((p) => {
                const totalSold = velocityMap[p._id.toString()] || 0;
                const averageDailySales = totalSold / forecastDays;
                const daysUntilStockout =
                    averageDailySales > 0 ? Math.floor(p.stock / averageDailySales) : Infinity;
                return {
                    name: p.name,
                    currentStock: p.stock,
                    lowStockThreshold: p.lowStockThreshold,
                    totalSold,
                    averageDailySales: +averageDailySales.toFixed(2),
                    daysUntilStockout: isFinite(daysUntilStockout) ? daysUntilStockout : null,
                    reorderRecommended: daysUntilStockout < 14 || p.stock <= p.lowStockThreshold,
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

        // PERF: Aggregation-only — $lookup replaces the preliminary Product.find()
        const productPerformance = await Order.aggregate([
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
            // Keep only items belonging to this seller
            { $match: { '_product.seller': sellerId } },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    // Carry product metadata through the group stage using $first
                    name: { $first: '$_product.name' },
                    category: { $first: '$_product.category' },
                    price: { $first: '$_product.price' },
                    stock: { $first: '$_product.stock' },
                },
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    category: 1,
                    price: 1,
                    stock: 1,
                    totalSold: 1,
                    revenue: 1,
                },
            },
            { $sort: { revenue: -1 } },
        ]);

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

        const [result] = await Order.aggregate([
            {
                $match: {
                    $or: [{ paymentStatus: 'completed' }, { status: 'delivered' }],
                    createdAt: { $gte: startDate },
                },
            },
            {
                $project: {
                    orderDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    // Platform revenue = tax + shipping + $2 fixed fee
                    platformRevenue: {
                        $add: [
                            { $ifNull: ['$taxPrice', 0] },
                            { $ifNull: ['$shippingPrice', 0] },
                            2,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$orderDate',
                    revenue: { $sum: '$platformRevenue' },
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

        const analytics = result ?? {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            salesData: [],
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

        const [result] = await Order.aggregate([
            {
                $group: {
                    _id: '$customer',
                    orderIds: { $addToSet: '$_id' },
                    totalSpent: { $sum: '$totalPrice' },
                    lastOrderDate: { $max: '$createdAt' },
                },
            },
            {
                $project: {
                    totalSpent: 1,
                    lastOrderDate: 1,
                    totalOrders: { $size: '$orderIds' },
                },
            },
            {
                $facet: {
                    topCustomers: [
                        { $sort: { totalSpent: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'customerInfo',
                            },
                        },
                        { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: false } },
                        {
                            $project: {
                                _id: 0,
                                name: '$customerInfo.name',
                                email: '$customerInfo.email',
                                totalOrders: 1,
                                totalSpent: 1,
                                lastOrderDate: 1,
                            },
                        },
                    ],
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalCustomers: { $sum: 1 },
                                repeatCustomers: {
                                    $sum: {
                                        $cond: [{ $gt: ['$totalOrders', 1] }, 1, 0],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ]);

        const topCustomers = result?.topCustomers || [];
        const stats = result?.stats?.[0] || { totalCustomers: 0, repeatCustomers: 0 };
        const totalCustomers = stats.totalCustomers;
        const repeatCustomerRate =
            totalCustomers > 0 ? (stats.repeatCustomers / totalCustomers) * 100 : 0;

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

        const productPerformance = await Order.aggregate([
            // PERF: Filter completed orders BEFORE the expensive $unwind so MongoDB
            // only processes a fraction of the collection.
            {
                $match: {
                    paymentStatus: 'completed',
                },
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 0,
                    name: '$product.name',
                    category: '$product.category',
                    price: '$product.price',
                    stock: '$product.stock',
                    totalSold: 1,
                    revenue: 1,
                },
            },
            { $sort: { revenue: -1 } },
        ]);

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
