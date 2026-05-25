import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import cache from '../utils/cache.js';
import { BaseController } from './BaseController.js';
import { sanitizeSearchInput } from '../utils/sanitize.js';

// Cache TTLs
const STATS_TTL = 90;  // 90 s — dashboard aggregate numbers
const LIST_TTL  = 10;  // 10 s — paginated admin list pages

class AdminController extends BaseController {
    // @desc    Get dashboard statistics
    // @route   GET /api/admin/stats
    // @access  Private/Admin
    getDashboardStats = async (req, res) => {
        // CACHE: Dashboard aggregate numbers change infrequently — safe to cache for 90 s.
        const CACHE_KEY = 'admin:stats';
        const cached = await cache.get(CACHE_KEY);
        if (cached) return this.handleSuccess(res, { stats: cached }, 200);

        const [
            totalUsers,
            totalStores,
            totalProducts,
            totalOrders,
            recentUsers,
            recentOrders,
            customerCount,
            sellerCount,
            settings,
            revenueResult,
        ] = await Promise.all([
            User.countDocuments(),
            Store.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'name email'),
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'seller' }),
            Settings.getSettings(),
            // PERFORMANCE: compute revenue inside MongoDB — no document hydration needed
            Order.aggregate([
                {
                    $match: {
                        $or: [{ paymentStatus: 'completed' }, { status: 'delivered' }],
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalTax: { $sum: '$taxPrice' },
                        totalShipping: { $sum: '$shippingPrice' },
                        orderCount: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // Add platform fixed fee per completed order (not stored on each order doc)
        const fixedFeePerOrder = settings.fixedFeePerOrder || 0;
        const revenueData = revenueResult[0] ?? { totalTax: 0, totalShipping: 0, orderCount: 0 };
        const totalRevenue =
            revenueData.totalTax +
            revenueData.totalShipping +
            revenueData.orderCount * fixedFeePerOrder;

        const stats = {
            totalUsers,
            totalStores,
            totalProducts,
            totalOrders,
            totalRevenue,
            customerCount,
            sellerCount,
            recentUsers,
            recentOrders,
        };

        await cache.set(CACHE_KEY, stats, STATS_TTL);
        this.handleSuccess(res, { stats }, 200);
    };

    // @desc    Get all users
    // @route   GET /api/admin/users
    // @access  Private/Admin
    getAllUsers = async (req, res) => {
        const { role = '', search = '', page = 1, limit = 10 } = req.query;
        const cacheKey = `admin:users:role=${role}:search=${search}:page=${page}:limit=${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, cached, 200);

        const query = {};
        if (role) query.role = role;
        
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [users, count] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit),
            User.countDocuments(query),
        ]);

        const payload = {
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        };
        await cache.set(cacheKey, payload, LIST_TTL);
        this.handleSuccess(res, payload, 200);
    };

    // @desc    Get all stores
    // @route   GET /api/admin/stores
    // @access  Private/Admin
    getAllStores = async (req, res) => {
        const { category = '', isActive = '', search = '', page = 1, limit = 10 } = req.query;
        const cacheKey = `admin:stores:cat=${category}:active=${isActive}:search=${search}:page=${page}:limit=${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, cached, 200);

        const query = {};
        if (category) query.category = category;
        if (isActive !== '') query.isActive = isActive === 'true';
        
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [stores, count] = await Promise.all([
            Store.find(query)
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit),
            Store.countDocuments(query),
        ]);

        const payload = {
            stores,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        };
        await cache.set(cacheKey, payload, LIST_TTL);
        this.handleSuccess(res, payload, 200);
    };

    // @desc    Get all products
    // @route   GET /api/admin/products
    // @access  Private/Admin
    getAllProducts = async (req, res) => {
        const { category = '', search = '', page = 1, limit = 10 } = req.query;
        const cacheKey = `admin:products:cat=${category}:search=${search}:page=${page}:limit=${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, cached, 200);

        const query = {};
        if (category) query.category = category;
        
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [products, count] = await Promise.all([
            Product.find(query)
                .populate('store', 'name')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit),
            Product.countDocuments(query),
        ]);

        const payload = {
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        };
        await cache.set(cacheKey, payload, LIST_TTL);
        this.handleSuccess(res, payload, 200);
    };

    // @desc    Get all orders
    // @route   GET /api/admin/orders
    // @access  Private/Admin
    getAllOrders = async (req, res) => {
        const { status = '', paymentStatus = '', search = '', page = 1, limit = 10 } = req.query;
        const cacheKey = `admin:orders:status=${status}:pay=${paymentStatus}:search=${search}:page=${page}:limit=${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return this.handleSuccess(res, cached, 200);

        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            query.orderNumber = { $regex: safeSearch, $options: 'i' };
        }

        const [orders, count] = await Promise.all([
            Order.find(query)
                .populate('customer', 'name email')
                .populate('items.product', 'name')
                .populate('items.store', 'name')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit),
            Order.countDocuments(query),
        ]);

        const payload = {
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        };
        await cache.set(cacheKey, payload, LIST_TTL);
        this.handleSuccess(res, payload, 200);
    };

    // @desc    Update store status (activate/deactivate)
    // @route   PUT /api/admin/stores/:id/status
    // @access  Private/Admin
    updateStoreStatus = async (req, res) => {
        const { isActive } = req.body;

        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
            });
        }

        // Invalidate store list caches and dashboard stats on status change
        await Promise.all([
            cache.delPattern('admin:stores:*'),
            cache.del('admin:stats'),
        ]);

        this.handleSuccess(res, {
            message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
            store,
        }, 200);
    };

    // @desc    Delete user
    // @route   DELETE /api/admin/users/:id
    // @access  Private/Admin
    deleteUser = async (req, res) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users',
            });
        }

        await user.deleteOne();

        // Invalidate user list caches and dashboard stats
        await Promise.all([cache.delPattern('admin:users:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'User deleted successfully' }, 200);
    };

    // @desc    Delete store
    // @route   DELETE /api/admin/stores/:id
    // @access  Private/Admin
    deleteStore = async (req, res) => {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
            });
        }

        // Delete all products associated with this store
        await Product.deleteMany({ store: store._id });
        await store.deleteOne();

        // Invalidate store + product list caches and dashboard stats
        await Promise.all([
            cache.delPattern('admin:stores:*'),
            cache.delPattern('admin:products:*'),
            cache.del('admin:stats'),
        ]);

        this.handleSuccess(res, { message: 'Store and associated products deleted successfully' }, 200);
    };

    // @desc    Delete product
    // @route   DELETE /api/admin/products/:id
    // @access  Private/Admin
    deleteProduct = async (req, res) => {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        await product.deleteOne();

        // Invalidate product list caches and dashboard stats
        await Promise.all([cache.delPattern('admin:products:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'Product deleted successfully' }, 200);
    };

    // @desc    Delete order
    // @route   DELETE /api/admin/orders/:id
    // @access  Private/Admin
    deleteOrder = async (req, res) => {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        await order.deleteOne();

        // Invalidate order list caches and dashboard stats
        await Promise.all([cache.delPattern('admin:orders:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'Order deleted successfully' }, 200);
    };

    // @desc    Get settings
    // @route   GET /api/admin/settings
    // @access  Private/Admin
    getSettings = async (req, res) => {
        const settings = await Settings.getSettings();
        this.handleSuccess(res, { settings }, 200);
    };

    // @desc    Update settings
    // @route   PUT /api/admin/settings
    // @access  Private/Admin
    updateSettings = async (req, res) => {
        const { taxRate, shippingFee, fixedFeePerOrder } = req.body;

        const settings = await Settings.updateSettings(
            { taxRate, shippingFee, fixedFeePerOrder },
            req.user._id
        );

        // Settings affect revenue calculation in dashboard stats — invalidate
        await cache.del('admin:stats');

        this.handleSuccess(res, {
            message: 'Settings updated successfully',
            settings,
        }, 200);
    };
}

export default new AdminController();
