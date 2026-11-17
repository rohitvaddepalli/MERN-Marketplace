import { query } from '../db/index.js';
import { toOrder } from '../db/mappers.js';

export const ORDERS_SELECT = `
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

export const loadRelations = async (orders) => {
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

export const orderFromRow = (r, relations = {}) => {
    const joined = r.customer_id_j
        ? { _id: r.customer_id_j, name: r.customer_name, email: r.customer_email }
        : null;
    return toOrder(r, {
        items: r.items ?? [],
        customer: joined ?? r.customer_id,
        productNames: relations.productNames,
        storeNames: relations.storeNames,
    });
};

export const getBulkDiscountPercentage = (product, quantity) => {
    const tiers = product?.bulkDiscounts ?? product?.bulk_discounts ?? [];
    if (!tiers.length) return 0;

    const applicable = tiers
        .filter((d) => quantity >= d.quantity)
        .sort((a, b) => b.discountPercentage - a.discountPercentage);

    return applicable[0]?.discountPercentage ?? 0;
};

export const verifyOrderItems = async (items) => {
    const ids = items.map((i) => i.product);
    const { rows } = ids.length
        ? await query('SELECT * FROM products WHERE id = ANY($1::uuid[])', [ids])
        : { rows: [] };
    const productMap = new Map(rows.map((p) => [p.id, p]));

    const errors = [];
    const verified = [];

    for (const item of items) {
        const product = productMap.get(item.product);
        if (!product) {
            errors.push(`Product ${item.product} not found`);
            continue;
        }
        if (!product.is_active) {
            errors.push(`Product "${product.name}" is no longer available`);
            continue;
        }
        if (product.stock < item.quantity) {
            errors.push(`Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`);
            continue;
        }
        verified.push({ item, product });
    }

    return { verified, errors };
};

export const updateOrderFields = async (orderId, fields) => {
    const sets = [];
    const vals = [];
    const push = (column, value) => {
        vals.push(value);
        sets.push(`${column} = $${vals.length}`);
    };

    if (fields.status !== undefined) push('status', fields.status);
    if (fields.paymentStatus !== undefined) push('payment_status', fields.paymentStatus);
    if (fields.deliveredAt !== undefined) push('delivered_at', fields.deliveredAt);

    if (sets.length === 0) {
        const { rows } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
        return rows[0] ? toOrder(rows[0]) : null;
    }

    vals.push(orderId);
    const { rows } = await query(
        `UPDATE orders SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
        vals
    );
    return rows[0] ? toOrder(rows[0]) : null;
};
