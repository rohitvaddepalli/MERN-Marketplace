import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalStores,
                totalProducts,
                totalOrders,
                totalRevenue,
                customerCount,
                sellerCount,
                recentUsers,
                recentOrders,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message,
        });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        const query = {};

        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: escapeRegex(search), $options: 'i' } },
                { email: { $regex: escapeRegex(search), $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message,
        });
    }
};

// @desc    Get all stores
// @route   GET /api/admin/stores
// @access  Private/Admin
export const getAllStores = async (req, res) => {
    try {
        const { category, isActive, search, page = 1, limit = 10 } = req.query;

        const query = {};

        if (category) query.category = category;
        if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: escapeRegex(search), $options: 'i' } },
                { description: { $regex: escapeRegex(search), $options: 'i' } },
            ];
        }

        const stores = await Store.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Store.countDocuments(query);

        res.status(200).json({
            success: true,
            stores,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stores',
            error: error.message,
        });
    }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAllProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;

        const query = {};

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: escapeRegex(search), $options: 'i' } },
                { description: { $regex: escapeRegex(search), $options: 'i' } },
            ];
        }

        const products = await Product.find(query)
            .populate('store', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message,
        });
    }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const { status, paymentStatus, search, page = 1, limit = 10 } = req.query;

        const query = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (search) {
            query.orderNumber = { $regex: escapeRegex(search), $options: 'i' };
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate('items.product', 'name')
            .populate('items.store', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message,
        });
    }
};

// @desc    Update store status (activate/deactivate)
// @route   PUT /api/admin/stores/:id/status
// @access  Private/Admin
export const updateStoreStatus = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
            store,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating store status',
            error: error.message,
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message,
        });
    }
};

// @desc    Delete store
// @route   DELETE /api/admin/stores/:id
// @access  Private/Admin
export const deleteStore = async (req, res) => {
    try {
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

        res.status(200).json({
            success: true,
            message: 'Store and associated products deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting store',
            error: error.message,
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message,
        });
    }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        await order.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            error: error.message,
        });
    }
};

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        res.status(200).json({
            success: true,
            settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message,
        });
    }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
    try {
        const { taxRate, shippingFee, fixedFeePerOrder } = req.body;

        // Validate inputs
        if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Tax rate must be between 0 and 100',
            });
        }

        if (shippingFee !== undefined && shippingFee < 0) {
            return res.status(400).json({
                success: false,
                message: 'Shipping fee cannot be negative',
            });
        }

        if (fixedFeePerOrder !== undefined && fixedFeePerOrder < 0) {
            return res.status(400).json({
                success: false,
                message: 'Fixed fee per order cannot be negative',
            });
        }

        const settings = await Settings.updateSettings(
            { taxRate, shippingFee, fixedFeePerOrder },
            req.user._id
        );

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message,
        });
    }
};
