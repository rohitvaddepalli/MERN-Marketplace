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
            shippingPrice,
            taxPrice,
            totalPrice,
            guestInfo
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items'
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
                    message: `Product not found: ${item.product}`
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            // SECURITY: Compute line price from server-side Product.price with bulk discounts
            let price = product.price;
            if (product.bulkDiscounts && product.bulkDiscounts.length > 0) {
                const sortedDiscounts = [...product.bulkDiscounts].sort((a, b) => b.quantity - a.quantity);
                const applicableDiscount = sortedDiscounts.find(d => item.quantity >= d.quantity);

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
                price: price // Use server-side calculated price
            });
        }

        // SECURITY: Compute server-side totals
        const serverTaxPrice = parseFloat((serverItemsPrice * TAX_RATE).toFixed(2));
        const serverShippingPrice = settings.shippingFee || 0;
        const serverTotalPrice = parseFloat((serverItemsPrice + serverTaxPrice + serverShippingPrice).toFixed(2));

        // SECURITY: Validate client-submitted prices against server-computed prices
        // Allow small floating-point tolerance (0.01)
        const tolerance = 0.01;
        if (Math.abs(serverItemsPrice - itemsPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Items price verification failed. Expected ₹${serverItemsPrice}, received ₹${itemsPrice}`
            });
        }
        if (Math.abs(serverTaxPrice - taxPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Tax price verification failed. Expected ₹${serverTaxPrice}, received ₹${taxPrice}`
            });
        }
        if (Math.abs(serverTotalPrice - totalPrice) > tolerance) {
            return res.status(400).json({
                success: false,
                message: `Price mismatch: Total price verification failed. Expected ₹${serverTotalPrice}, received ₹${totalPrice}`
            });
        }

        const orderData = {
            items: verifiedItems, // Use server-verified items with server-side prices
            shippingAddress,
            paymentMethod,
            itemsPrice: serverItemsPrice, // Use server-computed prices
            shippingPrice: serverShippingPrice,
            taxPrice: serverTaxPrice,
            totalPrice: serverTotalPrice
        };

        if (req.user) {
            orderData.customer = req.user._id;
        } else {
            // SECURITY: Validate guest email format
            if (!guestInfo || !guestInfo.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest email is required'
                });
            }

            // Import validator for email validation
            const validator = await import('validator');
            if (!validator.default.isEmail(guestInfo.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Normalize email
            orderData.guestInfo = {
                ...guestInfo,
                email: validator.default.normalizeEmail(guestInfo.email)
            };
        }

        const order = await Order.create(orderData);

        // Update product stock
        for (const item of verifiedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private/Customer
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('items.product', 'name images')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Order not found'
            });
        }

        // Make sure user is order owner or seller of products in order
        const isCustomer = order.customer._id.toString() === req.user._id.toString();
        const isSeller = order.items.some(item =>
            item.product && item.product.seller &&
            item.product.seller.toString() === req.user._id.toString()
        );

        if (!isCustomer && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Seller
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id)
            .populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if seller owns any products in the order
        const hasSellersProduct = order.items.some(item =>
            item.product && item.product.seller &&
            item.product.seller.toString() === req.user._id.toString()
        );

        if (!hasSellersProduct) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        order.status = status;
        if (status === 'delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save();

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller/orders
// @access  Private/Seller
export const getSellerOrders = async (req, res) => {
    try {
        // Get all orders that contain seller's products
        const orders = await Order.find({})
            .populate('customer', 'name email')
            .populate({
                path: 'items.product',
                populate: { path: 'seller' }
            })
            .sort('-createdAt');

        // Filter orders to only include items from this seller
        const sellerOrders = orders.map(order => {
            const sellerItems = order.items.filter(item =>
                item.product && item.product.seller &&
                item.product.seller._id.toString() === req.user._id.toString()
            );

            if (sellerItems.length > 0) {
                return {
                    ...order.toObject(),
                    items: sellerItems
                };
            }
            return null;
        }).filter(order => order !== null);

        res.status(200).json({
            success: true,
            count: sellerOrders.length,
            orders: sellerOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customer', 'name email')
            .populate('items.product', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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
                message: 'Order not found'
            });
        }

        // Ensure user is the customer who placed the order
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Only allow cancellation if order is pending or processing
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in ${order.status} status`
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Restore stock
        for (const item of order.items) {
            if (item.product) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
