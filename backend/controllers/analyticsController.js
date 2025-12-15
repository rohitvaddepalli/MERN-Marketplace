import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Get sales analytics
// @route   GET /api/analytics/sales
// @access  Private/Seller
export const getSalesAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get seller's products
        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);

        // Get orders containing seller's products
        const orders = await Order.find({
            'items.product': { $in: productIds },
            createdAt: { $gte: startDate }
        }).populate('items.product');

        // Calculate total revenue
        let totalRevenue = 0;
        let totalOrders = 0;
        const dailySales = {};

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];

            order.items.forEach(item => {
                if (productIds.some(id => id.equals(item.product._id))) {
                    const itemRevenue = item.price * item.quantity;
                    totalRevenue += itemRevenue;

                    if (!dailySales[orderDate]) {
                        dailySales[orderDate] = { revenue: 0, orders: 0 };
                    }
                    dailySales[orderDate].revenue += itemRevenue;
                }
            });
            totalOrders++;
        });

        // Format daily sales for chart
        const salesData = Object.keys(dailySales).map(date => ({
            date,
            revenue: dailySales[date].revenue,
            orders: dailySales[date].orders
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            analytics: {
                totalRevenue,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                salesData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get customer behavior analytics
// @route   GET /api/analytics/customers
// @access  Private/Seller
export const getCustomerAnalytics = async (req, res) => {
    try {
        // Get seller's products
        const products = await Product.find({ seller: req.user._id }).select('_id');
        const productIds = products.map(p => p._id);

        // Get orders containing seller's products
        const orders = await Order.find({
            'items.product': { $in: productIds }
        }).populate('customer', 'name email');

        // Analyze customer behavior
        const customerData = {};

        orders.forEach(order => {
            if (!order.customer) return; // Skip if customer is null

            const customerId = order.customer._id.toString();

            if (!customerData[customerId]) {
                customerData[customerId] = {
                    name: order.customer.name,
                    email: order.customer.email,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: order.createdAt
                };
            }

            customerData[customerId].totalOrders++;
            order.items.forEach(item => {
                if (productIds.some(id => id.equals(item.product))) {
                    customerData[customerId].totalSpent += item.price * item.quantity;
                }
            });

            if (new Date(order.createdAt) > new Date(customerData[customerId].lastOrderDate)) {
                customerData[customerId].lastOrderDate = order.createdAt;
            }
        });

        // Convert to array and sort by total spent
        const topCustomers = Object.values(customerData)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        const totalCustomers = Object.keys(customerData).length;
        const repeatCustomerRate = totalCustomers > 0
            ? (Object.values(customerData).filter(c => c.totalOrders > 1).length / totalCustomers * 100)
            : 0;

        res.status(200).json({
            success: true,
            analytics: {
                totalCustomers,
                topCustomers,
                repeatCustomerRate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get inventory forecasting
// @route   GET /api/analytics/inventory-forecast
// @access  Private/Seller
export const getInventoryForecast = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const forecastDays = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - forecastDays);

        // Get seller's products
        const products = await Product.find({ seller: req.user._id });
        const productIds = products.map(p => p._id);

        // Get recent orders
        const orders = await Order.find({
            'items.product': { $in: productIds },
            createdAt: { $gte: startDate }
        });

        // Calculate sales velocity for each product
        const productSales = {};

        products.forEach(product => {
            productSales[product._id] = {
                name: product.name,
                currentStock: product.stock,
                lowStockThreshold: product.lowStockThreshold,
                totalSold: 0,
                averageDailySales: 0,
                daysUntilStockout: 0,
                reorderRecommended: false
            };
        });

        orders.forEach(order => {
            order.items.forEach(item => {
                if (productSales[item.product]) {
                    productSales[item.product].totalSold += item.quantity;
                }
            });
        });

        // Calculate forecasts
        Object.keys(productSales).forEach(productId => {
            const data = productSales[productId];
            data.averageDailySales = data.totalSold / forecastDays;

            if (data.averageDailySales > 0) {
                data.daysUntilStockout = Math.floor(data.currentStock / data.averageDailySales);
                data.reorderRecommended = data.daysUntilStockout < 14 || data.currentStock <= data.lowStockThreshold;
            }
        });

        // Convert to array and sort by urgency
        const forecast = Object.values(productSales)
            .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

        res.status(200).json({
            success: true,
            forecast
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get product performance analytics
// @route   GET /api/analytics/products
// @access  Private/Seller
export const getProductAnalytics = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id });
        const productIds = products.map(p => p._id);

        // Get all orders with seller's products
        const orders = await Order.find({
            'items.product': { $in: productIds }
        });

        // Calculate performance metrics
        const productPerformance = {};

        products.forEach(product => {
            productPerformance[product._id] = {
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                totalSold: 0,
                revenue: 0,
                views: 0
            };
        });

        orders.forEach(order => {
            order.items.forEach(item => {
                if (productPerformance[item.product]) {
                    productPerformance[item.product].totalSold += item.quantity;
                    productPerformance[item.product].revenue += item.price * item.quantity;
                }
            });
        });

        // Convert to array and sort by revenue
        const topProducts = Object.values(productPerformance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const categoryPerformance = {};
        Object.values(productPerformance).forEach(product => {
            if (!categoryPerformance[product.category]) {
                categoryPerformance[product.category] = {
                    revenue: 0,
                    unitsSold: 0
                };
            }
            categoryPerformance[product.category].revenue += product.revenue;
            categoryPerformance[product.category].unitsSold += product.totalSold;
        });

        res.status(200).json({
            success: true,
            analytics: {
                topProducts,
                categoryPerformance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get system-wide sales analytics (Admin)
// @route   GET /api/analytics/admin/sales
// @access  Private/Admin
export const getAdminSalesAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all orders (completed or delivered)
        const orders = await Order.find({
            $or: [
                { paymentStatus: 'completed' },
                { status: 'delivered' }
            ],
            createdAt: { $gte: startDate }
        });

        // Calculate total revenue
        let totalRevenue = 0;
        let totalOrders = 0;
        const dailySales = {};

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];

            // Calculate revenue for this order (Tax + Shipping + Fixed Fee)
            const tax = order.taxPrice || 0;
            const shipping = order.shippingPrice || 0;
            const fixedFee = 2;
            const orderRevenue = tax + shipping + fixedFee;

            totalRevenue += orderRevenue;

            if (!dailySales[orderDate]) {
                dailySales[orderDate] = { revenue: 0, orders: 0 };
            }
            dailySales[orderDate].revenue += orderRevenue;
            dailySales[orderDate].orders += 1;

            totalOrders++;
        });

        // Format daily sales for chart
        const salesData = Object.keys(dailySales).map(date => ({
            date,
            revenue: dailySales[date].revenue,
            orders: dailySales[date].orders
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            analytics: {
                totalRevenue,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                salesData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get system-wide customer analytics (Admin)
// @route   GET /api/analytics/admin/customers
// @access  Private/Admin
export const getAdminCustomerAnalytics = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('customer', 'name email');

        const customerData = {};

        orders.forEach(order => {
            if (!order.customer) return;

            const customerId = order.customer._id.toString();

            if (!customerData[customerId]) {
                customerData[customerId] = {
                    name: order.customer.name,
                    email: order.customer.email,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: order.createdAt
                };
            }

            customerData[customerId].totalOrders++;
            customerData[customerId].totalSpent += order.totalPrice; // Total spent by customer across platform

            if (new Date(order.createdAt) > new Date(customerData[customerId].lastOrderDate)) {
                customerData[customerId].lastOrderDate = order.createdAt;
            }
        });

        const topCustomers = Object.values(customerData)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        const totalCustomers = Object.keys(customerData).length;
        const repeatCustomerRate = totalCustomers > 0
            ? (Object.values(customerData).filter(c => c.totalOrders > 1).length / totalCustomers * 100)
            : 0;

        res.status(200).json({
            success: true,
            analytics: {
                totalCustomers,
                topCustomers,
                repeatCustomerRate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get system-wide product analytics (Admin)
// @route   GET /api/analytics/admin/products
// @access  Private/Admin
export const getAdminProductAnalytics = async (req, res) => {
    try {
        const products = await Product.find({});
        const orders = await Order.find({});

        const productPerformance = {};

        // Initialize all products
        products.forEach(product => {
            productPerformance[product._id] = {
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                totalSold: 0,
                revenue: 0,
                views: 0 // Views would need specific tracking logic
            };
        });

        orders.forEach(order => {
            order.items.forEach(item => {
                if (productPerformance[item.product]) { // if product still exists
                    productPerformance[item.product].totalSold += item.quantity;
                    productPerformance[item.product].revenue += item.price * item.quantity;
                }
            });
        });

        const topProducts = Object.values(productPerformance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const categoryPerformance = {};
        Object.values(productPerformance).forEach(product => {
            if (!categoryPerformance[product.category]) {
                categoryPerformance[product.category] = {
                    revenue: 0,
                    unitsSold: 0
                };
            }
            categoryPerformance[product.category].revenue += product.revenue;
            categoryPerformance[product.category].unitsSold += product.totalSold;
        });

        res.status(200).json({
            success: true,
            analytics: {
                topProducts,
                categoryPerformance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
