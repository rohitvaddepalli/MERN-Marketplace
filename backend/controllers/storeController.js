import { query, isUuid, createBinder } from '../db/index.js';
import { toStore, toProduct } from '../db/mappers.js';
import { BaseController, pickAllowedFields } from './BaseController.js';
import { sanitizeSearchInput } from '../utils/sanitize.js';

const ALLOWED_STORE_UPDATE_FIELDS = [
    'name',
    'description',
    'category',
    'address',
    'contact',
    'logo',
    'banner',
];

class StoreController extends BaseController {
    createStore = async (req, res) => {
        const { name, description, category, address, contact, logo, banner } = req.body;

        // Check if seller already has a store (UNIQUE(owner_id) enforces this too)
        const existingStore = await query('SELECT id FROM stores WHERE owner_id = $1', [
            req.user._id,
        ]);
        if (existingStore.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You already have a store. Each seller can only have one store.',
            });
        }

        const { rows } = await query(
            `INSERT INTO stores (owner_id, name, description, category, address, contact, logo, banner)
             VALUES ($1, $2, $3, $4, $5, $6,
                     COALESCE($7, 'https://via.placeholder.com/150'),
                     COALESCE($8, 'https://via.placeholder.com/1200x300'))
             RETURNING *`,
            [
                req.user._id,
                name,
                description,
                category,
                JSON.stringify(address ?? {}),
                JSON.stringify(contact ?? {}),
                logo ?? null,
                banner ?? null,
            ]
        );

        this.handleSuccess(res, { store: toStore(rows[0]) }, 201);
    };
    getStores = async (req, res) => {
        const { category, search } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const params = [];
        const where = ['s.is_active = true'];
        const add = createBinder(params);

        if (category) where.push(`s.category = ${add(category)}`);

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            where.push(`s.name ILIKE '%' || ${add(safeSearch)} || '%'`);
        }

        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM stores s WHERE ${where.join(' AND ')}`,
            params
        );

        const listParams = [...params, limit, skip];
        const { rows } = await query(
            `SELECT s.*, u.name AS owner_name, u.email AS owner_email
             FROM stores s
             JOIN users u ON u.id = s.owner_id
             WHERE ${where.join(' AND ')}
             ORDER BY s.created_at DESC, s.id DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );
        const total = (await countPromise).rows[0].total;

        this.handleSuccess(
            res,
            {
                count: rows.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                stores: rows.map((r) => toStore(r)),
            },
            200
        );
    };
    getStore = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // PERF: Fetch store and its first 20 products in parallel
        const [storeResult, productsResult] = await Promise.all([
            query(
                `SELECT s.*, u.name AS owner_name, u.email AS owner_email
                 FROM stores s JOIN users u ON u.id = s.owner_id
                 WHERE s.id = $1`,
                [req.params.id]
            ),
            query(
                `SELECT * FROM products
                 WHERE store_id = $1 AND is_active = true
                 ORDER BY created_at DESC
                 LIMIT 20`,
                [req.params.id]
            ),
        ]);

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        this.handleSuccess(
            res,
            {
                store: toStore(storeResult.rows[0]),
                products: productsResult.rows.map((p) => toProduct(p)),
            },
            200
        );
    };
    updateStore = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const existing = await query('SELECT owner_id FROM stores WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        if (existing.rows[0].owner_id !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this store',
            });
        }

        // SECURITY: Only allow whitelisted fields to be updated
        const updates = pickAllowedFields(req.body, ALLOWED_STORE_UPDATE_FIELDS);
        const sets = [];
        const vals = [];
        for (const [field, value] of Object.entries(updates)) {
            vals.push(['address', 'contact'].includes(field) ? JSON.stringify(value ?? {}) : value);
            sets.push(`${field} = $${vals.length}`);
        }

        if (sets.length === 0) {
            const { rows } = await query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
            return this.handleSuccess(res, { store: toStore(rows[0]) }, 200);
        }

        vals.push(req.params.id);
        const { rows } = await query(
            `UPDATE stores SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
            vals
        );

        this.handleSuccess(res, { store: toStore(rows[0]) }, 200);
    };
    deleteStore = async (req, res) => {
        if (!isUuid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const existing = await query('SELECT owner_id FROM stores WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        if (existing.rows[0].owner_id !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this store',
            });
        }

        // products.store_id has ON DELETE CASCADE — same effect as the old
        // explicit Product.deleteMany() before store.deleteOne()
        await query('DELETE FROM stores WHERE id = $1', [req.params.id]);

        this.handleSuccess(res, { message: 'Store deleted successfully' }, 200);
    };
    getMyStore = async (req, res) => {
        const { rows } = await query('SELECT * FROM stores WHERE owner_id = $1', [req.user._id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'You do not have a store yet' });
        }

        const countResult = await query(
            'SELECT COUNT(*)::int AS count FROM products WHERE store_id = $1',
            [rows[0].id]
        );

        this.handleSuccess(
            res,
            { store: toStore(rows[0]), productsCount: countResult.rows[0].count },
            200
        );
    };
}

export default new StoreController();
