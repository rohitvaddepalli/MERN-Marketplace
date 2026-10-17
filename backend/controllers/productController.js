import { query, withTransaction } from '../db/index.js';
import { toProduct } from '../db/mappers.js';
import cache from '../utils/cache.js';
import { BaseController } from './BaseController.js';
import { sanitizeSearchInput } from '../utils/sanitize.js';

const PRODUCT_LIST_TTL = 60; // 60 seconds for filtered listings
const FEATURED_TTL = 5 * 60; // 5 minutes for featured (rarely changes)

// SECURITY: Whitelist of fields allowed for product updates / creation.
// (sku/weight/dimensions were always dropped by Mongoose strict mode; they are
// kept in the list only so behaviour stays identical — there are no columns.)
const ALLOWED_PRODUCT_FIELDS = [
    'name',
    'description',
    'price',
    'compareAtPrice',
    'stock',
    'lowStockThreshold',
    'category',
    'subcategory',
    'brand',
    'images',
    'specifications',
    'variants',
    'tags',
    'isActive',
    'sku',
    'weight',
    'dimensions',
];

// snake_case column names for the fields above
const COLUMN_FOR_FIELD = {
    name: 'name',
    description: 'description',
    price: 'price',
    compareAtPrice: 'compare_at_price',
    stock: 'stock',
    lowStockThreshold: 'low_stock_threshold',
    category: 'category',
    subcategory: 'subcategory',
    brand: 'brand',
    images: 'images',
    specifications: 'specifications',
    variants: 'variants',
    tags: 'tags',
    isActive: 'is_active',
};

const JSON_FIELDS = new Set(['specifications', 'variants']);
const ARRAY_FIELDS = new Set(['images', 'tags']);

/**
 * Build an INSERT/UPDATE column list from whitelisted fields only.
 * @returns {{ cols: string[], vals: unknown[], placeholders: string[] }}
 */
const buildFieldSets = (source, allowedFields) => {
    const cols = [];
    const vals = [];
    const placeholders = [];
    let idx = 1;
    for (const field of allowedFields) {
        const column = COLUMN_FOR_FIELD[field];
        if (!column || source[field] === undefined) continue;
        cols.push(column);
        vals.push(source[field]);
        placeholders.push(`$${idx++}`);
    }
    return { cols, vals, placeholders };
};

const pickAllowedFields = (source, allowedFields) => {
    const result = {};
    for (const field of allowedFields) {
        if (source[field] !== undefined) result[field] = source[field];
    }
    return result;
};

// Shared projection for listings: product + store/seller display info
const LIST_SELECT = `
    p.*,
    s.name  AS store_name,
    s.logo  AS store_logo,
    u.name  AS seller_name
`;

class ProductController extends BaseController {
    // @desc    Create product
    // @route   POST /api/products
    // @access  Private/Seller
    createProduct = async (req, res) => {
        const storeResult = await query('SELECT id FROM stores WHERE owner_id = $1', [
            req.user._id,
        ]);
        if (storeResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You need to create a store first',
            });
        }
        const storeId = storeResult.rows[0].id;

        const allowedData = pickAllowedFields(req.body, ALLOWED_PRODUCT_FIELDS);
        const { cols, vals, placeholders } = buildFieldSets(
            { ...allowedData, images: allowedData.images ?? [], tags: allowedData.tags ?? [] },
            ALLOWED_PRODUCT_FIELDS
        );

        cols.push('store_id', 'seller_id');
        vals.push(storeId, req.user._id);
        placeholders.push(`$${vals.length - 1}`, `$${vals.length}`);

        const { rows } = await query(
            `INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders.join(', ')})
             RETURNING *`,
            vals
        );

        // Invalidate product listing caches
        await cache.delPattern('products:list:*');
        await cache.del('products:featured');

        this.handleSuccess(res, { product: toProduct(rows[0]) }, 201);
    };

    // @desc    Get all products
    // @route   GET /api/products
    // @access  Public
    getProducts = async (req, res) => {
        const {
            category,
            subcategory,
            minPrice,
            maxPrice,
            search,
            store,
            sort,
            brand,
            color,
            size,
        } = req.query;

        // Every bound value goes through add() so placeholder numbering can
        // never drift from the params array.
        const params = [];
        const add = (value) => {
            params.push(value);
            return `$${params.length}`;
        };
        const where = ['p.is_active = true'];

        if (category) where.push(`p.category = ${add(category)}`);
        if (subcategory) where.push(`p.subcategory = ${add(subcategory)}`);
        if (store) where.push(`p.store_id = ${add(store)}`);
        if (brand) where.push(`p.brand = ${add(brand)}`);

        if (minPrice) where.push(`p.price >= ${add(Number(minPrice))}`);
        if (maxPrice) where.push(`p.price <= ${add(Number(maxPrice))}`);

        // SECURITY: sanitized to prevent ReDoS — used as a literal substring
        const safeColor = sanitizeSearchInput(color);
        if (safeColor) {
            const ph = add(safeColor);
            where.push(`(
                EXISTS (
                    SELECT 1 FROM jsonb_array_elements(p.variants) v
                    WHERE v->>'name' = 'Color'
                      AND EXISTS (
                          SELECT 1 FROM jsonb_array_elements_text(v->'options') o
                          WHERE o ILIKE '%' || ${ph} || '%'
                      )
                )
                OR p.specifications->>'Color' ILIKE '%' || ${ph} || '%'
            )`);
        }

        const safeSize = sanitizeSearchInput(size);
        if (safeSize) {
            const ph = add(safeSize);
            where.push(`(
                EXISTS (
                    SELECT 1 FROM jsonb_array_elements(p.variants) v
                    WHERE v->>'name' = 'Size'
                      AND EXISTS (
                          SELECT 1 FROM jsonb_array_elements_text(v->'options') o
                          WHERE o ILIKE '%' || ${ph} || '%'
                      )
                )
                OR p.specifications->>'Size' ILIKE '%' || ${ph} || '%'
            )`);
        }

        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
            const ph = add(safeSearch);
            where.push(`to_tsvector('english',
                p.name || ' ' || p.description || ' ' || COALESCE(p.brand, ''))
                @@ plainto_tsquery('english', ${ph})`);
        }

        // Sort + keyset column (keyset keeps cursor pages in ORDER BY order —
        // Mongo compared time-ordered ObjectIds, UUIDs are not time-ordered)
        let sortColumn = 'created_at';
        let sortDir = 'DESC';
        if (sort === 'price-asc') {
            sortColumn = 'price';
            sortDir = 'ASC';
        } else if (sort === 'price-desc') {
            sortColumn = 'price';
            sortDir = 'DESC';
        } else if (sort === 'rating') {
            sortColumn = 'rating';
            sortDir = 'DESC';
        }

        const limit = parseInt(req.query.limit, 10) || 50;
        const cursor = req.query.cursor;
        const page = parseInt(req.query.page, 10) || 1;

        // Cache only simple, un-filtered, first-page requests
        const isSimpleRequest = !search && !cursor && page === 1 && !color && !size;
        const cacheKey = isSimpleRequest
            ? `products:list:cat=${category || ''}&sub=${subcategory || ''}&brand=${brand || ''}&sort=${sort || ''}&limit=${limit}&minP=${minPrice || ''}&maxP=${maxPrice || ''}&store=${store || ''}`
            : null;

        if (cacheKey) {
            const hit = await cache.get(cacheKey);
            if (hit) return res.status(200).json({ success: true, ...hit });
        }

        // Cursor = the id of the last row the client already holds. Resolve its
        // sort key, then continue strictly after (sortKey, id) in ORDER BY order.
        if (cursor) {
            const cursorRow = await query(
                `SELECT id, ${sortColumn} FROM products WHERE id = $1`,
                [cursor]
            );
            if (cursorRow.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid cursor' });
            }
            const valuePh = add(cursorRow.rows[0][sortColumn]);
            const idPh = add(cursorRow.rows[0].id);
            const op = sortDir === 'ASC' ? '>' : '<';
            where.push(
                `(p.${sortColumn} ${op} ${valuePh}
                  OR (p.${sortColumn} = ${valuePh} AND p.id ${op} ${idPh}))`
            );
        }

        const whereSql = where.join(' AND ');
        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM products p WHERE ${whereSql}`,
            params
        );

        const listParams = [...params, limit];
        let listSql = `SELECT ${LIST_SELECT}
                     FROM products p
                     JOIN stores s ON s.id = p.store_id
                     JOIN users  u ON u.id = p.seller_id
                     WHERE ${whereSql}
                     ORDER BY p.${sortColumn} ${sortDir}, p.id ${sortDir}
                     LIMIT $${listParams.length}`;
        if (!cursor) {
            listParams.push((page - 1) * limit);
            listSql += ` OFFSET $${listParams.length}`;
        }

        const [listResult, countResult] = await Promise.all([
            query(listSql, listParams),
            countPromise,
        ]);

        const products = listResult.rows.map((r) => toProduct(r));
        const total = countResult.rows[0].total;
        const nextCursor =
            products.length === limit && cursor ? products[products.length - 1]._id : null;

        const payload = {
            count: products.length,
            total,
            page: cursor ? null : page,
            pages: cursor ? null : Math.ceil(total / limit),
            nextCursor,
            products,
        };

        if (cacheKey) await cache.set(cacheKey, payload, PRODUCT_LIST_TTL);

        this.handleSuccess(res, payload, 200);
    };

    // @desc    Get single product
    // @route   GET /api/products/:id
    // @access  Public
    getProduct = async (req, res) => {
        const { rows } = await query(
            `SELECT p.*,
                    s.name AS store_name, s.logo AS store_logo,
                    s.description AS store_description, s.contact AS store_contact,
                    u.name AS seller_name, u.email AS seller_email
             FROM products p
             JOIN stores s ON s.id = p.store_id
             JOIN users  u ON u.id = p.seller_id
             WHERE p.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const r = rows[0];
        const product = toProduct(r, {
            store: {
                _id: r.store_id,
                name: r.store_name,
                logo: r.store_logo,
                description: r.store_description,
                contact: r.store_contact,
            },
            seller: { _id: r.seller_id, name: r.seller_name, email: r.seller_email },
        });

        this.handleSuccess(res, { product }, 200);
    };

    // @desc    Update product
    // @route   PUT /api/products/:id
    // @access  Private/Seller
    updateProduct = async (req, res) => {
        const updates = pickAllowedFields(req.body, ALLOWED_PRODUCT_FIELDS);
        const entries = Object.entries(updates).filter(
            ([field]) => COLUMN_FOR_FIELD[field]
        );

        if (entries.length === 0) {
            // Nothing to update — mirror findOneAndUpdate returning the doc
            const existing = await query(
                'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
                [req.params.id, req.user._id]
            );
            if (existing.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Product not found or not authorized to update',
                });
            }
            return this.handleSuccess(res, { product: toProduct(existing.rows[0]) }, 200);
        }

        const sets = [];
        const vals = [];
        entries.forEach(([field]) => {
            const column = COLUMN_FOR_FIELD[field];
            let value = updates[field];
            if (JSON_FIELDS.has(column)) value = JSON.stringify(value ?? {});
            if (ARRAY_FIELDS.has(column)) value = value ?? [];
            vals.push(value);
            sets.push(`${column} = $${vals.length}`);
        });
        sets.push('updated_at = now()');
        vals.push(req.params.id, req.user._id);

        const { rows } = await query(
            `UPDATE products SET ${sets.join(', ')}
             WHERE id = $${vals.length - 1} AND seller_id = $${vals.length}
             RETURNING *`,
            vals
        );

        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Product not found or not authorized to update',
            });
        }

        await cache.delPattern('products:list:*');

        this.handleSuccess(res, { product: toProduct(rows[0]) }, 200);
    };

    // @desc    Delete product
    // @route   DELETE /api/products/:id
    // @access  Private/Seller
    deleteProduct = async (req, res) => {
        const { rows } = await query(
            'SELECT seller_id FROM products WHERE id = $1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (rows[0].seller_id !== req.user._id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product',
            });
        }

        await query('DELETE FROM products WHERE id = $1', [req.params.id]);

        await cache.delPattern('products:list:*');
        await cache.del('products:featured');

        this.handleSuccess(res, { message: 'Product deleted successfully' }, 200);
    };

    // @desc    Get seller's products
    // @route   GET /api/products/my/products
    // @access  Private/Seller
    getMyProducts = async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 50;
        const cursor = req.query.cursor;
        const page = parseInt(req.query.page, 10) || 1;

        const where = ['p.seller_id = $1'];
        const params = [req.user._id];

        if (cursor) {
            const cursorRow = await query(
                'SELECT id, created_at FROM products WHERE id = $1',
                [cursor]
            );
            if (cursorRow.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid cursor' });
            }
            params.push(cursorRow.rows[0].created_at, cursorRow.rows[0].id);
            where.push(
                `(p.created_at < $${params.length - 1}
                  OR (p.created_at = $${params.length - 1} AND p.id < $${params.length}))`
            );
        }

        const whereSql = where.join(' AND ');
        const countPromise = query(
            `SELECT COUNT(*)::int AS total FROM products p WHERE ${whereSql}`,
            params.slice(0, cursor ? 2 : 1)
        );

        const listParams = [...params, limit];
        const limitPh = `$${listParams.length}`;
        let sql = `SELECT p.*, s.name AS store_name
                   FROM products p
                   JOIN stores s ON s.id = p.store_id
                   WHERE ${whereSql}
                   ORDER BY p.created_at DESC, p.id DESC
                   LIMIT ${limitPh}`;
        if (!cursor) {
            listParams.push((page - 1) * limit);
            sql += ` OFFSET $${listParams.length}`;
        }

        const [listResult, countResult] = await Promise.all([
            query(sql, listParams),
            countPromise,
        ]);

        const products = listResult.rows.map((r) =>
            toProduct(r, {
                select: ['name', 'price', 'stock', 'isActive', 'images', 'createdAt'],
            })
        );
        const total = countResult.rows[0].total;
        const nextCursor =
            products.length === limit && cursor ? products[products.length - 1]._id : null;

        this.handleSuccess(
            res,
            {
                count: products.length,
                total,
                page: cursor ? null : page,
                pages: cursor ? null : Math.ceil(total / limit),
                nextCursor,
                products,
            },
            200
        );
    };

    // @desc    Get featured products
    // @route   GET /api/products/featured
    // @access  Public
    getFeaturedProducts = async (req, res) => {
        const cacheKey = 'products:featured';
        const hit = await cache.get(cacheKey);
        if (hit) return res.status(200).json({ success: true, products: hit });

        const { rows } = await query(
            `SELECT ${LIST_SELECT}
             FROM products p
             JOIN stores s ON s.id = p.store_id
             JOIN users  u ON u.id = p.seller_id
             WHERE p.is_active = true
             ORDER BY p.rating DESC, p.created_at DESC
             LIMIT 8`
        );
        const products = rows.map((r) => toProduct(r));

        await cache.set(cacheKey, products, FEATURED_TTL);

        this.handleSuccess(res, { products }, 200);
    };

    // @desc    Get low stock products
    // @route   GET /api/products/low-stock
    // @access  Private/Seller
    getLowStockProducts = async (req, res) => {
        const { rows } = await query(
            `SELECT ${LIST_SELECT}
             FROM products p
             JOIN stores s ON s.id = p.store_id
             JOIN users  u ON u.id = p.seller_id
             WHERE p.seller_id = $1 AND p.stock <= p.low_stock_threshold
             ORDER BY p.stock ASC`,
            [req.user._id]
        );
        const products = rows.map((r) => toProduct(r));

        this.handleSuccess(res, { count: products.length, products }, 200);
    };

    // @desc    Bulk import products
    // @route   POST /api/products/bulk-import
    // @access  Private/Seller
    bulkImportProducts = async (req, res) => {
        const { products } = req.body;

        const storeResult = await query('SELECT id FROM stores WHERE owner_id = $1', [
            req.user._id,
        ]);
        if (storeResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You need to create a store first',
            });
        }
        const storeId = storeResult.rows[0].id;

        const created = await withTransaction(async (client) => {
            const out = [];
            for (const product of products) {
                const allowed = pickAllowedFields(product, ALLOWED_PRODUCT_FIELDS);
                const { cols, vals, placeholders } = buildFieldSets(
                    { ...allowed, images: allowed.images ?? [], tags: allowed.tags ?? [] },
                    ALLOWED_PRODUCT_FIELDS
                );
                cols.push('store_id', 'seller_id');
                vals.push(storeId, req.user._id);
                placeholders.push(`$${vals.length - 1}`, `$${vals.length}`);
                const { rows } = await client.query(
                    `INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders.join(', ')})
                     RETURNING *`,
                    vals
                );
                out.push(rows[0]);
            }
            return out;
        });

        await cache.delPattern('products:list:*');
        await cache.del('products:featured');

        this.handleSuccess(
            res,
            { count: created.length, products: created.map((r) => toProduct(r)) },
            201
        );
    };

    // @desc    Export products to CSV
    // @route   GET /api/products/export
    // @access  Private/Seller
    exportProducts = async (req, res) => {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.write('ID,Name,Price,Stock,Category,isActive\n');

        const BATCH = 500;
        let afterId = null;
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

        try {
            // Keyset-paged batches keep memory flat instead of loading the
            // whole catalog (the old code streamed with a Mongo cursor).
            for (;;) {
                const params = [req.user._id, BATCH];
                let where = 'seller_id = $1';
                if (afterId) {
                    params.push(afterId);
                    where += ` AND id > $${params.length}`;
                }
                const { rows } = await query(
                    `SELECT id, name, price, stock, category, is_active
                     FROM products WHERE ${where} ORDER BY id ASC LIMIT $2`,
                    params
                );
                if (rows.length === 0) break;
                for (const r of rows) {
                    res.write(
                        `${escape(r.id)},${escape(r.name)},${r.price},${r.stock},${escape(r.category)},${r.is_active}\n`
                    );
                }
                afterId = rows[rows.length - 1].id;
                if (rows.length < BATCH) break;
            }
            res.end();
        } catch (error) {
            if (!res.headersSent) {
                this.handleError(error, res);
            } else {
                res.end();
            }
        }
    };
}

export default new ProductController();
