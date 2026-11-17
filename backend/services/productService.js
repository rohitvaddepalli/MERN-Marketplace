import { query } from '../db/index.js';
import { toProduct } from '../db/mappers.js';

export const getProductById = async (productId) => {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [productId]);
    return rows[0] ? toProduct(rows[0]) : null;
};

export const isProductOwnedBySeller = async (productId, sellerId) => {
    const { rows } = await query('SELECT seller_id FROM products WHERE id = $1', [productId]);
    if (!rows[0]) return false;
    return rows[0].seller_id === sellerId;
};

export const createProduct = async (data) => {
    const { rows } = await query(
        `INSERT INTO products
            (store_id, seller_id, name, description, price, compare_at_price, category,
             subcategory, brand, images, stock, tags, specifications, variants,
             low_stock_threshold, bulk_discounts, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
            data.store,
            data.seller,
            data.name,
            data.description,
            data.price,
            data.compareAtPrice ?? null,
            data.category,
            data.subcategory ?? null,
            data.brand ?? null,
            data.images ?? [],
            data.stock ?? 0,
            data.tags ?? [],
            JSON.stringify(data.specifications ?? {}),
            JSON.stringify(data.variants ?? []),
            data.lowStockThreshold ?? 10,
            JSON.stringify(data.bulkDiscounts ?? []),
            data.isActive ?? true,
        ]
    );
    return toProduct(rows[0]);
};

export const updateProductBySeller = async (productId, sellerId, updates) => {
    const sets = [];
    const vals = [];
    const push = (column, value) => {
        vals.push(value);
        sets.push(`${column} = $${vals.length}`);
    };

    if (updates.name !== undefined) push('name', updates.name);
    if (updates.description !== undefined) push('description', updates.description);
    if (updates.price !== undefined) push('price', updates.price);
    if (updates.stock !== undefined) push('stock', updates.stock);
    if (updates.isActive !== undefined) push('is_active', updates.isActive);
    if (updates.images !== undefined) push('images', updates.images);
    if (updates.category !== undefined) push('category', updates.category);

    if (sets.length === 0) {
        const { rows } = await query(
            'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
            [productId, sellerId]
        );
        return rows[0] ? toProduct(rows[0]) : null;
    }

    sets.push('updated_at = now()');
    vals.push(productId, sellerId);

    const { rows } = await query(
        `UPDATE products SET ${sets.join(', ')}
         WHERE id = $${vals.length - 1} AND seller_id = $${vals.length}
         RETURNING *`,
        vals
    );
    return rows[0] ? toProduct(rows[0]) : null;
};

export const deactivateProductBySeller = async (productId, sellerId) => {
    const { rows } = await query(
        `UPDATE products SET is_active = false, updated_at = now()
         WHERE id = $1 AND seller_id = $2
         RETURNING *`,
        [productId, sellerId]
    );
    return rows[0] ? toProduct(rows[0]) : null;
};
