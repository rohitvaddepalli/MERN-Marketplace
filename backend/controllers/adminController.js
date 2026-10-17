import { query, isUuid } from '../db/index.js';
import { toUser, toStore, toProduct, toOrder, toSettings } from '../db/mappers.js';
import cache from '../utils/cache.js';
import { BaseController } from './BaseController.js';
import { sanitizeSearchInput } from '../utils/sanitize.js';

// Cache TTLs
const STATS_TTL = 90; // 90 s — dashboard aggregate numbers
const LIST_TTL = 10; // 10 s — paginated admin list pages

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
            counts,
            recentUsers,
            recentOrders,
            settings,
            revenueResult,
        ] = await Promise.all([
            // One round-trip for all six counters (was six countDocuments calls)
            query(`
                SELECT
                    (SELECT COUNT(*) FROM users)::int    AS total_users,
                    (SELECT COUNT(*) FROM stores)::int   AS total_stores,
                    (SELECT COUNT(*) FROM products)::int AS total_products,
                    (SELECT COUNT(*) FROM orders)::int   AS total_orders,
                    (SELECT COUNT(*) FROM users WHERE role = 'customer')::int AS customer_count,
                    (SELECT COUNT(*) FROM users WHERE role = 'seller')::int    AS seller_count
            `),
            query(
                `SELECT * FROM users ORDER BY created_at DESC LIMIT 5`
            ),
            query(
                `SELECT o.*, cu.name AS customer_name, cu.email AS customer_email,
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
                            FROM order_items oi WHERE oi.order_id = o.id
                        ) AS items
                 FROM orders o LEFT JOIN users cu ON cu.id = o.customer_id
                 ORDER BY o.created_at DESC LIMIT 5`
            ),
            query('SELECT * FROM settings WHERE id = true'),
            // PERFORMANCE: revenue computed inside the database
            query(`
                SELECT COALESCE(SUM(tax_price), 0)::float       AS total_tax,
                       COALESCE(SUM(shipping_price), 0)::float  AS total_shipping,
                       COUNT(*)::int                            AS order_count
                FROM orders
                WHERE payment_status = 'completed' OR status = 'delivered'
            `),
        ]);

        const c = counts.rows[0];
        const settingsRow = settings.rows[0] ?? null;
        const fixedFeePerOrder = settingsRow?.fixed_fee_per_order || 0;
        const revenueData = revenueResult.rows[0] ?? {
            total_tax: 0,
            total_shipping: 0,
            order_count: 0,
        };
        const totalRevenue =
            revenueData.total_tax +
            revenueData.total_shipping +
            revenueData.order_count * fixedFeePerOrder;

        const stats = {
            totalUsers: c.total_users,
            totalStores: c.total_stores,
            totalProducts: c.total_products,
            totalOrders: c.total_orders,
            totalRevenue,
            customerCount: c.customer_count,
            sellerCount: c.seller_count,
            recentUsers: recentUsers.rows.map((r) => toUser(r, { lite: true })),
            recentOrders: recentOrders.rows.map((r) =>
                toOrder(r, {
                    items: r.items ?? [],
                    customer: r.customer_id
                        ? { _id: r.customer_id, name: r.customer_name, email: r.customer_email }
                        : null,
                })
            ),
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

        const params = [];
        const where = [];
        const add = (value) => {
            params.push(value);
            return `$${params.length}`;
        };

        if (role) where.push(`role = ${add(role)}`);

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            const ph = add(safeSearch);
            where.push(`(name ILIKE '%' || ${ph} || '%' OR email ILIKE '%' || ${ph} || '%')`);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const countPromise = query(`SELECT COUNT(*)::int AS total FROM users ${whereSql}`, params);

        const listParams = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
        const { rows } = await query(
            `SELECT * FROM users ${whereSql}
             ORDER BY created_at DESC, id DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );
        const count = (await countPromise).rows[0].total;

        const payload = {
            users: rows.map((r) => toUser(r, { lite: true })),
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
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

        const params = [];
        const where = [];
        const add = (value) => {
            params.push(value);
            return `$${params.length}`;
        };

        if (category) where.push(`s.category = ${add(category)}`);
        if (isActive !== '') where.push(`s.is_active = ${add(isActive === 'true')}`);

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            const ph = add(safeSearch);
            where.push(
                `(s.name ILIKE '%' || ${ph} || '%' OR s.description ILIKE '%' || ${ph} || '%')`
            );
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM stores s ${whereSql}`,
            params
        );

        const listParams = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
        const { rows } = await query(
            `SELECT s.*, u.name AS owner_name, u.email AS owner_email
             FROM stores s JOIN users u ON u.id = s.owner_id
             ${whereSql}
             ORDER BY s.created_at DESC, s.id DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );
        const count = (await countPromise).rows[0].total;

        const payload = {
            stores: rows.map((r) => toStore(r)),
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
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

        const params = [];
        const where = [];
        const add = (value) => {
            params.push(value);
            return `$${params.length}`;
        };

        if (category) where.push(`p.category = ${add(category)}`);

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            const ph = add(safeSearch);
            where.push(
                `(p.name ILIKE '%' || ${ph} || '%' OR p.description ILIKE '%' || ${ph} || '%')`
            );
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
            params
        );

        const listParams = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
        const { rows } = await query(
            `SELECT p.*, s.name AS store_name
             FROM products p LEFT JOIN stores s ON s.id = p.store_id
             ${whereSql}
             ORDER BY p.created_at DESC, p.id DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );
        const count = (await countPromise).rows[0].total;

        const payload = {
            products: rows.map((r) => toProduct(r)),
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
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

        const params = [];
        const where = [];
        const add = (value) => {
            params.push(value);
            return `$${params.length}`;
        };

        if (status) where.push(`o.status = ${add(status)}`);
        if (paymentStatus) where.push(`o.payment_status = ${add(paymentStatus)}`);

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            where.push(`o.order_number ILIKE '%' || ${add(safeSearch)} || '%'`);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM orders o ${whereSql}`,
            params
        );

        const listParams = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
        const { rows } = await query(
            `SELECT o.*,
                    cu.name AS customer_name, cu.email AS customer_email,
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
                        FROM order_items oi WHERE oi.order_id = o.id
                    ) AS items
             FROM orders o
             LEFT JOIN users cu ON cu.id = o.customer_id
             ${whereSql}
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );
        const count = (await countPromise).rows[0].total;

        // populate items.product → name (store name too, mirroring the old shape)
        const productIds = [
            ...new Set(rows.flatMap((r) => (r.items ?? []).map((i) => i.product)).filter(Boolean)),
        ];
        const storeIds = [
            ...new Set(rows.flatMap((r) => (r.items ?? []).map((i) => i.store)).filter(Boolean)),
        ];
        const [productRows, storeRows] = await Promise.all([
            productIds.length
                ? query(
                      `SELECT id, name, images, price, seller_id FROM products
                       WHERE id = ANY($1::uuid[])`,
                      [productIds]
                  )
                : { rows: [] },
            storeIds.length
                ? query(`SELECT id, name FROM stores WHERE id = ANY($1::uuid[])`, [storeIds])
                : { rows: [] },
        ]);
        const productInfo = Object.fromEntries(
            productRows.rows.map((p) => [
                p.id,
                { name: p.name, images: p.images, price: p.price, seller_id: p.seller_id },
            ])
        );
        const storeInfo = Object.fromEntries(storeRows.rows.map((s) => [s.id, s.name]));

        const payload = {
            orders: rows.map((r) =>
                toOrder(r, {
                    items: r.items ?? [],
                    customer: r.customer_id
                        ? { _id: r.customer_id, name: r.customer_name, email: r.customer_email }
                        : null,
                    productNames: productInfo,
                    storeNames: storeInfo,
                })
            ),
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
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
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const { rows } = await query(
            'UPDATE stores SET is_active = $1 WHERE id = $2 RETURNING *',
            [isActive, req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        await Promise.all([
            cache.delPattern('admin:stores:*'),
            cache.del('admin:stats'),
        ]);

        this.handleSuccess(
            res,
            {
                message: `Store ${isActive ? 'activated' : 'deactivated'} successfully`,
                store: toStore(rows[0]),
            },
            200
        );
    };

    // @desc    Verify / unverify a store
    // @route   PUT /api/admin/stores/:id/verify
    // @access  Private/Admin
    verifyStore = async (req, res) => {
        const { isVerified } = req.body;
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const { rows } = await query(
            'UPDATE stores SET is_verified = $1 WHERE id = $2 RETURNING *',
            [isVerified, req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        await cache.delPattern('admin:stores:*');

        this.handleSuccess(
            res,
            {
                message: `Store ${isVerified ? 'verified' : 'unverified'} successfully`,
                store: toStore(rows[0]),
            },
            200
        );
    };

    // @desc    Delete user
    // @route   DELETE /api/admin/users/:id
    // @access  Private/Admin
    deleteUser = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const existing = await query('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (existing.rows[0].role === 'admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Cannot delete admin users' });
        }

        await query('DELETE FROM users WHERE id = $1', [req.params.id]);

        await Promise.all([cache.delPattern('admin:users:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'User deleted successfully' }, 200);
    };

    // @desc    Delete store
    // @route   DELETE /api/admin/stores/:id
    // @access  Private/Admin
    deleteStore = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const existing = await query('SELECT id FROM stores WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // products.store_id ON DELETE CASCADE mirrors the explicit
        // Product.deleteMany() + store.deleteOne() of the Mongo version
        await query('DELETE FROM stores WHERE id = $1', [req.params.id]);

        await Promise.all([
            cache.delPattern('admin:stores:*'),
            cache.delPattern('admin:products:*'),
            cache.del('admin:stats'),
        ]);

        this.handleSuccess(
            res,
            { message: 'Store and associated products deleted successfully' },
            200
        );
    };

    // @desc    Delete product
    // @route   DELETE /api/admin/products/:id
    // @access  Private/Admin
    deleteProduct = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { rowCount } = await query('DELETE FROM products WHERE id = $1', [
            req.params.id,
        ]);
        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await Promise.all([cache.delPattern('admin:products:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'Product deleted successfully' }, 200);
    };

    // @desc    Delete order
    // @route   DELETE /api/admin/orders/:id
    // @access  Private/Admin
    deleteOrder = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const { rowCount } = await query('DELETE FROM orders WHERE id = $1', [req.params.id]);
        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        await Promise.all([cache.delPattern('admin:orders:*'), cache.del('admin:stats')]);

        this.handleSuccess(res, { message: 'Order deleted successfully' }, 200);
    };

    // @desc    Get settings
    // @route   GET /api/admin/settings
    // @access  Private/Admin
    getSettings = async (req, res) => {
        const { rows } = await query(
            `INSERT INTO settings (id) VALUES (true)
             ON CONFLICT (id) DO UPDATE SET id = true
             RETURNING *`
        );
        this.handleSuccess(res, { settings: toSettings(rows[0]) }, 200);
    };

    // @desc    Update settings
    // @route   PUT /api/admin/settings
    // @access  Private/Admin
    updateSettings = async (req, res) => {
        const { taxRate, shippingFee, fixedFeePerOrder } = req.body;

        // Partial updates keep the current value (Mongoose ignored undefined
        // fields in $set — SQL would otherwise write NULLs).
        const current = await query('SELECT * FROM settings WHERE id = true');
        const base = current.rows[0] ?? {
            tax_rate: 8,
            shipping_fee: 10,
            fixed_fee_per_order: 2,
        };

        const { rows } = await query(
            `INSERT INTO settings (id, tax_rate, shipping_fee, fixed_fee_per_order, updated_by, updated_at)
             VALUES (true, $1, $2, $3, $4, now())
             ON CONFLICT (id) DO UPDATE
                SET tax_rate = EXCLUDED.tax_rate,
                    shipping_fee = EXCLUDED.shipping_fee,
                    fixed_fee_per_order = EXCLUDED.fixed_fee_per_order,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = now()
             RETURNING *`,
            [
                taxRate ?? base.tax_rate,
                shippingFee ?? base.shipping_fee,
                fixedFeePerOrder ?? base.fixed_fee_per_order,
                req.user._id,
            ]
        );

        // Settings affect revenue calculation in dashboard stats — invalidate
        await cache.del('admin:stats');

        this.handleSuccess(
            res,
            {
                message: 'Settings updated successfully',
                settings: toSettings(rows[0]),
            },
            200
        );
    };
}

export default new AdminController();
