import crypto from 'crypto';
import validator from 'validator';
import { query, withTransaction, isUuid } from '../db/index.js';
import { toOrder } from '../db/mappers.js';
import cache from '../utils/cache.js';
import sendEmail from '../utils/sendEmail.js';
import { BaseController } from './BaseController.js';

// Orders + items with the populated fields the client expects:
//   customer {_id,name,email}, items[].product {name,images,price,seller},
//   items[].store {name}
const ORDERS_SELECT = `
    o.*,
    cu.id   AS customer_id_j,
    cu.name AS customer_name,
    cu.email AS customer_email,
    (
        SELECT json_agg(json_build_object(
                   'line_no', oi.line_no,
                   'product', oi.product_id,
                   'store',   oi.store_id,
                   'seller',  oi.seller_id,
                   'name',    oi.name,
                   'price',   oi.price,
                   'quantity',oi.quantity,
                   'image',   oi.image
               ) ORDER BY oi.line_no)
        FROM order_items oi
        WHERE oi.order_id = o.id
    ) AS items
`;

/** Load products/stores referenced by a page of orders (the "populate" step). */
const loadRelations = async (orders) => {
    const productIds = [
        ...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.product)).filter(Boolean)),
    ];
    const storeIds = [
        ...new Set(orders.flatMap((o) => (o.items ?? []).map((i) => i.store)).filter(Boolean)),
    ];

    const [products, stores] = await Promise.all([
        productIds.length
            ? query(
                  `SELECT id, name, images, price, stock, seller_id
                   FROM products WHERE id = ANY($1::uuid[])`,
                  [productIds]
              )
            : { rows: [] },
        storeIds.length
            ? query(`SELECT id, name FROM stores WHERE id = ANY($1::uuid[])`, [storeIds])
            : { rows: [] },
    ]);

    return {
        productNames: Object.fromEntries(
            products.rows.map((p) => [
                p.id,
                { name: p.name, images: p.images, price: p.price, seller_id: p.seller_id },
            ])
        ),
        storeNames: Object.fromEntries(stores.rows.map((s) => [s.id, s.name])),
    };
};

const orderFromRow = (r, relations = {}) => {
    const joined = r.customer_id_j
        ? { _id: r.customer_id_j, name: r.customer_name, email: r.customer_email }
        : null;
    return toOrder(r, {
        items: r.items ?? [],
        // populated customer object when we joined one, else the raw id (guest)
        customer: joined ?? r.customer_id,
        productNames: relations.productNames,
        storeNames: relations.storeNames,
    });
};

class OrderController extends BaseController {
    // @desc    Create new order
    // @route   POST /api/orders
    // @access  Private/Customer
    createOrder = async (req, res) => {
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
            return res.status(400).json({ success: false, message: 'No order items' });
        }

        const idempotencyKey = req.headers['idempotency-key'];
        if (idempotencyKey && req.user) {
            const cacheKey = `idempotency:order:${req.user._id}:${idempotencyKey}`;
            const existingOrderId = await cache.get(cacheKey);
            if (existingOrderId) {
                const existing = await query('SELECT * FROM orders WHERE id = $1', [
                    existingOrderId,
                ]);
                if (existing.rows.length > 0) {
                    const relations = await loadRelations([existing.rows[0]]);
                    return res.status(200).json({
                        success: true,
                        order: orderFromRow(existing.rows[0], relations),
                        cached: true,
                    });
                }
            }
        }

        // Get system settings for tax and shipping
        const settingsResult = await query('SELECT * FROM settings WHERE id = true');
        const settings = settingsResult.rows[0] ?? {
            tax_rate: 8,
            shipping_fee: 10,
            fixed_fee_per_order: 2,
        };
        const TAX_RATE = settings.tax_rate / 100;

        // SECURITY: Server-side price verification to prevent price tampering
        let serverItemsPrice = 0;
        const verifiedItems = [];

        const productIds = items.map((i) => i.product).filter(isUuid);
        if (productIds.length !== items.length) {
            return res
                .status(404)
                .json({ success: false, message: 'Product not found' });
        }

        const productDocs = await query(
            `SELECT * FROM products WHERE id = ANY($1::uuid[])`,
            [productIds]
        );
        const productMap = new Map(productDocs.rows.map((p) => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.product);
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

            // SECURITY: Compute line price from server-side price with bulk discounts
            let price = product.price;
            const bulkDiscounts = product.bulk_discounts ?? [];
            if (bulkDiscounts.length > 0) {
                const sorted = [...bulkDiscounts].sort((a, b) => b.quantity - a.quantity);
                const applicable = sorted.find((d) => item.quantity >= d.quantity);
                if (applicable) {
                    price = price * (1 - applicable.discountPercentage / 100);
                }
            }

            serverItemsPrice += price * item.quantity;

            verifiedItems.push({
                product: product.id,
                store: product.store_id,
                seller: product.seller_id,
                quantity: item.quantity,
                price,
            });
        }

        // SECURITY: Compute server-side totals
        const serverTaxPrice = parseFloat((serverItemsPrice * TAX_RATE).toFixed(2));
        const serverShippingPrice = settings.shipping_fee || 0;
        const serverTotalPrice = parseFloat(
            (serverItemsPrice + serverTaxPrice + serverShippingPrice).toFixed(2)
        );

        // SECURITY: Validate client-submitted prices against server-computed prices
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

        const guest = req.user
            ? null
            : (() => {
                  if (!guestInfo || !guestInfo.email) return 'missing';
                  if (!validator.isEmail(guestInfo.email)) return 'invalid';
                  return { ...guestInfo, email: validator.normalizeEmail(guestInfo.email) };
              })();
        if (guest === 'missing') {
            return res
                .status(400)
                .json({ success: false, message: 'Guest email is required' });
        }
        if (guest === 'invalid') {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Order + items + stock all commit together. The decrement carries its
        // own `stock >= qty` guard so concurrent checkouts can never oversell
        // (the old check-then-write could drive stock negative).
        let orderRow;
        try {
            orderRow = await withTransaction(async (client) => {
                const orderNumber = `ORD-${Date.now()}-${crypto
                    .randomBytes(3)
                    .toString('hex')
                    .toUpperCase()}`;

                const { rows } = await client.query(
                    `INSERT INTO orders
                        (order_number, customer_id, guest_info, shipping_address,
                         payment_method, items_price, shipping_price, tax_price, total_price)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                     RETURNING *`,
                    [
                        orderNumber,
                        req.user ? req.user._id : null,
                        guest ? JSON.stringify(guest) : '{}',
                        JSON.stringify(shippingAddress ?? {}),
                        paymentMethod,
                        serverItemsPrice,
                        serverShippingPrice,
                        serverTaxPrice,
                        serverTotalPrice,
                    ]
                );
                const order = rows[0];

                for (const [i, item] of verifiedItems.entries()) {
                    await client.query(
                        `INSERT INTO order_items
                            (order_id, line_no, product_id, store_id, seller_id, name, price, quantity, image)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                        [
                            order.id,
                            i + 1,
                            item.product,
                            item.store,
                            item.seller,
                            productMap.get(item.product).name,
                            item.price,
                            item.quantity,
                            productMap.get(item.product).images?.[0] ?? null,
                        ]
                    );

                    // Atomic conditional decrement — fails the whole transaction
                    const dec = await client.query(
                        `UPDATE products SET stock = stock - $1, updated_at = now()
                         WHERE id = $2 AND stock >= $1
                         RETURNING id`,
                        [item.quantity, item.product]
                    );
                    if (dec.rows.length === 0) {
                        throw Object.assign(
                            new Error(
                                `Insufficient stock for ${productMap.get(item.product).name}`
                            ),
                            { statusCode: 400 }
                        );
                    }
                }

                return order;
            });
        } catch (err) {
            if (err.statusCode === 400) {
                return res.status(400).json({ success: false, message: err.message });
            }
            throw err;
        }

        if (idempotencyKey && req.user) {
            const cacheKey = `idempotency:order:${req.user._id}:${idempotencyKey}`;
            await cache.set(cacheKey, orderRow.id, 5 * 60);
        }

        const relations = await loadRelations([orderRow]);
        const order = orderFromRow(orderRow, relations);

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

        // Transactional confirmation via Resend — best-effort, never blocks checkout
        const recipient = req.user?.email ?? guest?.email ?? null;
        if (recipient) {
            sendEmail({
                email: recipient,
                subject: `Order ${order.orderNumber} confirmed`,
                message: [
                    `<h1>Thanks for your order, ${order.customer?.name ?? ''}!</h1>`,
                    `<p>Order <strong>${order.orderNumber}</strong> has been received.</p>`,
                    `<p>Items: ${verifiedItems.length} · Total: ₹${order.totalPrice}</p>`,
                    `<p>We'll notify you when it ships.</p>`,
                ].join(''),
            }).catch(() => {
                // Email failures are logged inside sendEmail — checkout already succeeded
            });
        }

        this.handleSuccess(res, { order }, 201);
    };

    // @desc    Get logged in user orders
    // @route   GET /api/orders/myorders
    // @access  Private/Customer
    getMyOrders = async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 20;
        const cursor = req.query.cursor;

        const params = [req.user._id];
        let where = 'o.customer_id = $1';
        if (cursor) {
            if (!isUuid(cursor)) {
                return res.status(400).json({ success: false, message: 'Invalid cursor' });
            }
            params.push(cursor);
            where += ` AND o.id < $${params.length}`;
        }
        params.push(limit);

        const { rows } = await query(
            `SELECT ${ORDERS_SELECT}
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE ${where}
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT $${params.length}`,
            params
        );

        const relations = await loadRelations(rows);
        const orders = rows.map((r) => orderFromRow(r, relations));
        const nextCursor = orders.length === limit ? orders[orders.length - 1]._id : null;

        this.handleSuccess(res, { count: orders.length, nextCursor, orders }, 200);
    };

    // @desc    Get single order
    // @route   GET /api/orders/:id
    // @access  Private
    getOrder = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const { rows } = await query(
            `SELECT ${ORDERS_SELECT}
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE o.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const relations = await loadRelations(rows);
        const order = orderFromRow(rows[0], relations);

        // Make sure user is order owner or seller of products in order
        const isCustomer =
            order.customer &&
            (order.customer._id ?? order.customer).toString() === req.user._id.toString();
        const isSeller = order.items.some(
            (item) =>
                (item.seller && item.seller.toString() === req.user._id.toString()) ||
                (item.product &&
                    item.product.seller &&
                    item.product.seller.toString() === req.user._id.toString())
        );

        if (!isCustomer && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order',
            });
        }

        this.handleSuccess(res, { order }, 200);
    };

    // @desc    Update order status
    // @route   PUT /api/orders/:id/status
    // @access  Private/Seller
    updateOrderStatus = async (req, res) => {
        const { status } = req.body;

        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const { rows } = await query(
            `SELECT ${ORDERS_SELECT}
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE o.id = $1`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const relations = await loadRelations(rows);
        const order = orderFromRow(rows[0], relations);

        // Check if seller owns any products in the order
        const hasSellersProduct = order.items.some(
            (item) =>
                (item.seller && item.seller.toString() === req.user._id.toString()) ||
                (item.product &&
                    item.product.seller &&
                    item.product.seller.toString() === req.user._id.toString())
        );

        if (!hasSellersProduct) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order',
            });
        }

        const { rows: updatedRows } = await query(
            `UPDATE orders
             SET status = $1,
                 delivered_at = CASE WHEN $1 = 'delivered' THEN now() ELSE delivered_at END
             WHERE id = $2
             RETURNING *`,
            [status, req.params.id]
        );
        order.status = updatedRows[0].status;
        order.deliveredAt = updatedRows[0].delivered_at
            ? new Date(updatedRows[0].delivered_at).toISOString()
            : order.deliveredAt;

        // Emit real-time status update to buyer and order room
        const io = req.app.get('io');
        if (io) {
            const statusEvent = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                updatedAt: new Date().toISOString(),
            };
            if (order.customer) {
                io.to(`user:${order.customer._id ?? order.customer}`).emit(
                    'order:status',
                    statusEvent
                );
            }
            io.to(`order:${order._id}`).emit('order:status', statusEvent);
        }

        this.handleSuccess(res, { order }, 200);
    };

    // @desc    Get seller orders
    // @route   GET /api/orders/seller/orders
    // @access  Private/Seller
    //
    // The old Mongo pipeline ($unwind → $lookup → $match → $group) becomes a
    // join against order_items (which stores seller_id directly) plus a
    // lateral load of only the seller's line items per order.
    getSellerOrders = async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 20;

        let cursorDate = null;
        if (req.query.cursor) {
            cursorDate = new Date(req.query.cursor);
            if (isNaN(cursorDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid cursor value' });
            }
        }

        const params = [req.user._id];
        let where = '';
        if (cursorDate) {
            params.push(cursorDate);
            where = `AND o.created_at < $${params.length}`;
        }
        params.push(limit);

        const { rows } = await query(
            `SELECT o.*,
                    cu.id AS customer_id_j, cu.name AS customer_name, cu.email AS customer_email,
                    (
                        SELECT json_agg(json_build_object(
                                   'line_no', oi.line_no,
                                   'product', oi.product_id,
                                   'store',   oi.store_id,
                                   'seller',  oi.seller_id,
                                   'name',    oi.name,
                                   'price',   oi.price,
                                   'quantity',oi.quantity,
                                   'image',   oi.image
                               ) ORDER BY oi.line_no)
                        FROM order_items oi
                        WHERE oi.order_id = o.id AND oi.seller_id = $1
                    ) AS items
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE EXISTS (
                 SELECT 1 FROM order_items oi2
                 WHERE oi2.order_id = o.id AND oi2.seller_id = $1
             )
             ${where}
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT $${params.length}`,
            params
        );

        const orders = rows.map((r) => {
            const joined = r.customer_id_j
                ? { _id: r.customer_id_j, name: r.customer_name, email: r.customer_email }
                : null;
            return toOrder(r, { items: r.items ?? [], customer: joined ?? r.customer_id });
        });

        const nextCursor =
            orders.length === limit
                ? new Date(rows[rows.length - 1].created_at).toISOString()
                : null;

        this.handleSuccess(res, { count: orders.length, nextCursor, orders }, 200);
    };

    // @desc    Get all orders (Admin)
    // @route   GET /api/orders
    // @access  Private/Admin
    getAllOrders = async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 20;
        const cursor = req.query.cursor;

        const params = [];
        let where = 'true';
        if (cursor) {
            if (!isUuid(cursor)) {
                return res.status(400).json({ success: false, message: 'Invalid cursor' });
            }
            params.push(cursor);
            where = `o.id < $${params.length}`;
        }
        params.push(limit);

        const { rows } = await query(
            `SELECT ${ORDERS_SELECT}
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE ${where}
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT $${params.length}`,
            params
        );

        const relations = await loadRelations(rows);
        const orders = rows.map((r) => orderFromRow(r, relations));
        const nextCursor = orders.length === limit ? orders[orders.length - 1]._id : null;

        this.handleSuccess(res, { count: orders.length, nextCursor, orders }, 200);
    };

    // @desc    Cancel order
    // @route   PUT /api/orders/:id/cancel
    // @access  Private/Customer
    cancelOrder = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const { rows } = await query(
            `SELECT ${ORDERS_SELECT}
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             WHERE o.id = $1`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const relations = await loadRelations(rows);
        const order = orderFromRow(rows[0], relations);

        // Ensure user is the customer who placed the order
        if ((order.customer?._id ?? order.customer)?.toString() !== req.user._id.toString()) {
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

        const { rows: updatedRows } = await query(
            `UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        order.status = updatedRows[0].status;

        // Restore stock for items that still reference a product
        const itemsWithProduct = (order.items ?? []).filter((i) => i.product);
        if (itemsWithProduct.length > 0) {
            await withTransaction(async (client) => {
                for (const item of itemsWithProduct) {
                    await client.query(
                        'UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2',
                        [item.quantity, item.product]
                    );
                }
            });
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
            if (order.customer) {
                io.to(`user:${order.customer._id ?? order.customer}`).emit(
                    'order:cancelled',
                    cancelEvent
                );
            }
            io.to(`order:${order._id}`).emit('order:cancelled', cancelEvent);

            const storeIds = [
                ...new Set(itemsWithProduct.map((i) => i.store).filter(Boolean)),
            ];
            storeIds.forEach((storeId) => {
                io.to(`store:${storeId}`).emit('order:cancelled', cancelEvent);
            });
        }

        this.handleSuccess(res, { order }, 200);
    };
}

export default new OrderController();
