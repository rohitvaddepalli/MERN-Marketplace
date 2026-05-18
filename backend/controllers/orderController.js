import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice: _shippingPrice, // received but overridden server-side for security
            taxPrice,
            totalPrice,
            guestInfo,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items',
            });
        }

        // Get system settings for tax and shipping
        const settings = await Settings.getSettings();
        const TAX_RATE = settings.taxRate / 100;

        // SECURITY: Server-side price verification to prevent price tampering
        let serverItemsPrice = 0;
        const verifiedItems = [];

        // Verify products exist, have sufficient stock, and compute server-side prices
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`,
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`,
                });
            }

            // SECURITY: Compute line price from server-side Product.price with bulk discounts
            let price = product.price;
            if (product.bulkDiscounts && product.bulkDiscounts.length > 0) {
                const sortedDiscounts = [...product.bulkDiscounts].sort(
                    (a, b) => b.quantity - a.quantity
                );
                const applicableDiscount = sortedDiscounts.find((d) => item.quantity >= d.quantity);

                if (applicableDiscount) {
                    price = price * (1 - applicableDiscount.discountPercentage / 100);
                }
            }

            const linePrice = price * item.quantity;
            serverItemsPrice += linePrice;

            verifiedItems.push({
                product: item.product,
                store: item.store,
                quantity: item.quantity,
                price: price, // Use server-side calculated price
            });
        }

        // SECURITY: Compute server-side totals
        const serverTaxPrice = parseFloat((serverItemsPrice * TAX_RATE).toFixed(2));
        const serverShippingPrice = settings.shippingFee || 0;
        const serverTotalPrice = parseFloat(
            (serverItemsPrice + serverTaxPrice + serverShippingPrice).toFixed(2)
        );

        // SECURITY: Validate client-submitted prices against server-computed prices
        // Allow small floating-point tolerance (0.01)
        const tolerance = 0.01;
        if (Math.abs(serverItemsPrice - itemsPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Items price verification failed. Expected ₹${serverItemsPrice}, received ₹${itemsPrice}`,
            });
        }
        if (Math.abs(serverTaxPrice - taxPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Tax price verification failed. Expected ₹${serverTaxPrice}, received ₹${taxPrice}`,
            });
        }
        if (Math.abs(serverTotalPrice - totalPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Total price verification failed. Expected ₹${serverTotalPrice}, received ₹${totalPrice}`,
            });
        }

        const orderData = {
            items: verifiedItems, // Use server-verified items with server-side prices
            shippingAddress,
            paymentMethod,
            itemsPrice: serverItemsPrice, // Use server-computed prices
            shippingPrice: serverShippingPrice,
            taxPrice: serverTaxPrice,
            totalPrice: serverTotalPrice,
        };

        if (req.user) {
            orderData.customer = req.user._id;
        } else {
            // SECURITY: Validate guest email format
            if (!guestInfo || !guestInfo.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest email is required',
                });
            }

            // Import validator for email validation
            const validator = await import('validator');
            if (!validator.default.isEmail(guestInfo.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                });
            }

            // Normalize email
            orderData.guestInfo = {
                ...guestInfo,
                email: validator.default.normalizeEmail(guestInfo.email),
            };
        }

        const order = await Order.create(orderData);

        // Update product stock
        if (verifiedItems.length > 0) {
            const bulkOps = verifiedItems.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: -item.quantity } },
                },
            }));
            await Product.bulkWrite(bulkOps);
        }

        // Emit real-time notification to seller's store room
        const io = req.app.get('io');
        if (io && verifiedItems.length > 0) {
            const storeIds = [...new Set(verifiedItems.map((i) => i.store).filter(Boolean))];
            storeIds.forEach((storeId) => {
                io.to(`store:${storeId}`).emit('order:new', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    totalPrice: order.totalPrice,
                    itemCount: verifiedItems.length,
                });
            });
        }

        res.status(201).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private/Customer
export const getMyOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const cursor = req.query.cursor;
        const query = { customer: req.user._id };

        if (cursor) {
            query._id = { $lt: cursor };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'items.product',
                select: 'name images seller',
                populate: { path: 'seller', select: 'name store' },
            })
            .populate('items.store', 'name')
            .sort('-createdAt')
            .limit(limit);

        const nextCursor = orders.length === limit ? orders[orders.length - 1]._id : null;

        res.status(200).json({
            success: true,
            count: orders.length,
            nextCursor,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('items.product', 'name images price seller') // Added 'seller' to enable seller authorization check
            .populate('items.store', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Make sure user is order owner or seller of products in order
        const isCustomer = order.customer._id.toString() === req.user._id.toString();
        const isSeller = order.items.some(
            (item) =>
                item.product &&
                item.product.seller &&
                item.product.seller.toString() === req.user._id.toString()
        );

        if (!isCustomer && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order',
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Seller
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id).populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Check if seller owns any products in the order
        const hasSellersProduct = order.items.some(
            (item) =>
                item.product &&
                item.product.seller &&
                item.product.seller.toString() === req.user._id.toString()
        );

        if (!hasSellersProduct) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order',
            });
        }

        order.status = status;
        if (status === 'delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save();

        // Emit real-time status update to buyer and order room
        const io = req.app.get('io');
        if (io) {
            const statusEvent = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                updatedAt: new Date().toISOString(),
            };
            // Buyer's personal room
            if (order.customer) {
                io.to(`user:${order.customer}`).emit('order:status', statusEvent);
            }
            // Order tracking room (anyone watching this order)
            io.to(`order:${order._id}`).emit('order:status', statusEvent);
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/orders
// @access  Private/Seller
//
// ARCHITECTURE: Uses an aggregation pipeline instead of loading every order
// into memory and filtering in JavaScript.  The pipeline:
//   1. $unwind   — flattens items so we can inspect each item's product
//   2. $lookup   — joins Product to get the seller field
//   3. $match    — keeps only items belonging to the requesting seller
//   4. $lookup   — joins User (customer) for display info
//   5. $group    — reassembles per-order documents with only the seller's items
//   6. $sort     — newest first
//   7. $limit    — honour the caller's page-size
export const getSellerOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;

        // Cursor is a createdAt ISO timestamp (must align with the $sort: { createdAt: -1 } stage)
        let cursorDate = null;
        if (req.query.cursor) {
            cursorDate = new Date(req.query.cursor);
            if (isNaN(cursorDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid cursor value' });
            }
        }

        const pipeline = [
            // 1. Only consider orders created before the cursor (keyset pagination on createdAt)
            ...(cursorDate ? [{ $match: { createdAt: { $lt: cursorDate } } }] : []),

            // 2. Flatten order items so we can filter by seller
            { $unwind: '$items' },

            // 3. Join Product to get the seller reference
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'items._productDoc',
                },
            },

            // 4. Keep only items that belong to this seller
            {
                $match: {
                    'items._productDoc.seller': req.user._id,
                },
            },

            // 5. Join the customer User document
            {
                $lookup: {
                    from: 'users',
                    localField: 'customer',
                    foreignField: '_id',
                    as: '_customerDoc',
                },
            },

            // 6. Reassemble one document per order; collapse the seller's items back
            {
                $group: {
                    _id: '$_id',
                    orderNumber: { $first: '$orderNumber' },
                    status: { $first: '$status' },
                    paymentStatus: { $first: '$paymentStatus' },
                    paymentMethod: { $first: '$paymentMethod' },
                    shippingAddress: { $first: '$shippingAddress' },
                    itemsPrice: { $first: '$itemsPrice' },
                    shippingPrice: { $first: '$shippingPrice' },
                    taxPrice: { $first: '$taxPrice' },
                    totalPrice: { $first: '$totalPrice' },
                    createdAt: { $first: '$createdAt' },
                    deliveredAt: { $first: '$deliveredAt' },
                    customer: { $first: { $arrayElemAt: ['$_customerDoc', 0] } },
                    items: {
                        $push: {
                            product: '$items.product',
                            name: '$items.name',
                            price: '$items.price',
                            quantity: '$items.quantity',
                            image: '$items.image',
                            store: '$items.store',
                        },
                    },
                },
            },

            // 7. Clean up customer projection (hide password)
            {
                $project: {
                    orderNumber: 1,
                    status: 1,
                    paymentStatus: 1,
                    paymentMethod: 1,
                    shippingAddress: 1,
                    itemsPrice: 1,
                    shippingPrice: 1,
                    taxPrice: 1,
                    totalPrice: 1,
                    createdAt: 1,
                    deliveredAt: 1,
                    items: 1,
                    'customer._id': 1,
                    'customer.name': 1,
                    'customer.email': 1,
                },
            },

            { $sort: { createdAt: -1 } },
            { $limit: limit },
        ];

        const sellerOrders = await Order.aggregate(pipeline);
        // Return createdAt as the next cursor so the client can pass it back
        const nextCursor =
            sellerOrders.length === limit
                ? sellerOrders[sellerOrders.length - 1].createdAt
                : null;

        res.status(200).json({
            success: true,
            count: sellerOrders.length,
            nextCursor,
            orders: sellerOrders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const cursor = req.query.cursor;
        const query = {};

        if (cursor) {
            query._id = { $lt: cursor };
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate('items.product', 'name')
            .sort('-createdAt')
            .limit(limit);

        const nextCursor = orders.length === limit ? orders[orders.length - 1]._id : null;

        res.status(200).json({
            success: true,
            count: orders.length,
            nextCursor,
            orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private/Customer
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Ensure user is the customer who placed the order
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order',
            });
        }

        // Only allow cancellation if order is pending or processing
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in ${order.status} status`,
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Restore stock
        const itemsWithProduct = order.items.filter((item) => item.product);
        if (itemsWithProduct.length > 0) {
            const bulkOps = itemsWithProduct.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: item.quantity } },
                },
            }));
            await Product.bulkWrite(bulkOps);
        }

        // Emit real-time cancellation notifications
        const io = req.app.get('io');
        if (io) {
            const cancelEvent = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
            };

            // Buyer's personal room (confirms their cancellation)
            if (order.customer) {
                io.to(`user:${order.customer}`).emit('order:cancelled', cancelEvent);
            }

            // Order tracking room (anyone watching this order)
            io.to(`order:${order._id}`).emit('order:cancelled', cancelEvent);

            // Notify each seller's store room so dashboards update without polling
            const storeIds = [
                ...new Set(itemsWithProduct.map((i) => i.store).filter(Boolean)),
            ];
            storeIds.forEach((storeId) => {
                io.to(`store:${storeId}`).emit('order:cancelled', cancelEvent);
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
