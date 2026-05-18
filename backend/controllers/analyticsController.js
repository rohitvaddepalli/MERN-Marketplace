import Order from '../models/Order.js';
import Product from '../models/Product.js';
import cache from '../utils/cache.js';

const CACHE_TTL = 5 * 60; // 5 minutes

// ── Seller analytics ──────────────────────────────────────────────────────────

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Seller
export const getSalesAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = Math.min(parseInt(period) || 30, 365); // cap at 1 year
        const sellerId = req.user._id;
        const cacheKey = `analytics:sales:${sellerId}:${days}`;

        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Step 1: resolve seller's product IDs
        const productIds = (await Product.find({ seller: sellerId }).select('_id')).map(
            (p) => p._id
        );

        // Step 2: aggregation pipeline — all math done in MongoDB
        const [result] = await Order.aggregate([
            {
                $match: {
                    'items.product': { $in: productIds },
                    createdAt: { $gte: startDate },
                },
            },
            // Unwind items so we can filter to this seller's products only
            { $unwind: '$items' },
            { $match: { 'items.product': { $in: productIds } } },
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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get customer behavior analytics
// @route   GET /api/analytics/customers
// @access  Private/Seller
export const getCustomerAnalytics = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const cacheKey = `analytics:customers:${sellerId}`;

        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const productIds = (await Product.find({ seller: sellerId }).select('_id')).map(
            (p) => p._id
        );

        const customers = await Order.aggregate([
            { $match: { 'items.product': { $in: productIds } } },
            { $unwind: '$items' },
            { $match: { 'items.product': { $in: productIds } } },
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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get inventory forecasting
// @route   GET /api/analytics/inventory-forecast
// @access  Private/Seller
export const getInventoryForecast = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const forecastDays = Math.min(parseInt(days) || 30, 365);
        const sellerId = req.user._id;
        const cacheKey = `analytics:forecast:${sellerId}:${forecastDays}`;

        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - forecastDays);

        // Sales velocity per product via aggregation
        const salesVelocity = await Order.aggregate([
            {
                $match: {
                    'items.product': {
                        $in: (await Product.find({ seller: sellerId }).select('_id')).map(
                            (p) => p._id
                        ),
                    },
                    createdAt: { $gte: startDate },
                },
            },
            { $unwind: '$items' },
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

        const products = await Product.find({ seller: sellerId }).select(
            'name stock lowStockThreshold'
        );
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
        res.status(200).json({ success: true, forecast });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get product performance analytics
// @route   GET /api/analytics/products
// @access  Private/Seller
export const getProductAnalytics = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const cacheKey = `analytics:products:${sellerId}`;

        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const productIds = (await Product.find({ seller: sellerId }).select('_id')).map(
            (p) => p._id
        );

        const productPerformance = await Order.aggregate([
            { $match: { 'items.product': { $in: productIds } } },
            { $unwind: '$items' },
            { $match: { 'items.product': { $in: productIds } } },
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
            { $unwind: '$product' },
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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Admin analytics ───────────────────────────────────────────────────────────

// @desc    Get system-wide sales analytics (Admin)
// @route   GET /api/analytics/admin/sales
// @access  Private/Admin
export const getAdminSalesAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = Math.min(parseInt(period) || 30, 365);
        const cacheKey = `analytics:admin:sales:${days}`;

        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get system-wide customer analytics (Admin)
// @route   GET /api/analytics/admin/customers
// @access  Private/Admin
export const getAdminCustomerAnalytics = async (req, res) => {
    try {
        const cacheKey = 'analytics:admin:customers';
        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const customers = await Order.aggregate([
            {
                $group: {
                    _id: '$customer',
                    orderIds: { $addToSet: '$_id' },
                    totalSpent: { $sum: '$totalPrice' },
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
                    totalOrders: { $size: '$orderIds' },
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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get system-wide product analytics (Admin)
// @route   GET /api/analytics/admin/products
// @access  Private/Admin
export const getAdminProductAnalytics = async (req, res) => {
    try {
        const cacheKey = 'analytics:admin:products';
        const cached = await cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...cached });

        const productPerformance = await Order.aggregate([
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

        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
