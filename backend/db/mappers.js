/**
 * db/mappers.js — turn Postgres rows into the exact JSON shapes the React
 * client used to receive from Mongoose:
 *
 *   - `_id` (not `id`) for every entity
 *   - populated subdocuments appear as nested objects or null
 *   - camelCase keys everywhere (snake_case stays inside SQL)
 *
 * Keeping the wire format identical means the frontend needs no changes for
 * the storage swap — only the auth token changes (Clerk).
 */

const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

export const toUser = (r, { lite = false } = {}) => {
    if (!r) return null;
    const base = {
        _id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        avatar: r.avatar,
        phone: r.phone ?? undefined,
        address: r.address ?? {},
        wishlist: r.wishlist ?? [],
        createdAt: iso(r.created_at),
    };
    if (lite) return base;
    return {
        ...base,
        recentlyViewed: (r.recently_viewed ?? []).map((item) => ({
            product: item.product,
            viewedAt: iso(item.viewedAt) ?? iso(r.created_at),
        })),
    };
};

export const toStore = (r, { owner } = {}) => {
    if (!r) return null;
    return {
        _id: r.id,
        name: r.name,
        description: r.description,
        owner: owner ?? r.owner_id,
        logo: r.logo,
        banner: r.banner,
        category: r.category,
        address: r.address ?? {},
        contact: r.contact ?? {},
        rating: r.rating,
        reviewCount: r.review_count,
        isActive: r.is_active,
        isVerified: r.is_verified,
        businessHours: r.business_hours,
        createdAt: iso(r.created_at),
        ...(r.owner_name !== undefined
            ? {
                  owner: {
                      _id: r.owner_id,
                      name: r.owner_name,
                      email: r.owner_email,
                  },
              }
            : {}),
    };
};

export const toProduct = (r, { store, seller, select } = {}) => {
    if (!r) return null;
    const full = {
        _id: r.id,
        name: r.name,
        description: r.description,
        price: r.price,
        compareAtPrice: r.compare_at_price ?? undefined,
        category: r.category,
        subcategory: r.subcategory ?? undefined,
        brand: r.brand ?? undefined,
        images: r.images ?? [],
        stock: r.stock,
        rating: r.rating,
        reviewCount: r.review_count,
        tags: r.tags ?? [],
        specifications: r.specifications ?? {},
        variants: r.variants ?? [],
        lowStockThreshold: r.low_stock_threshold,
        bulkDiscounts: r.bulk_discounts ?? [],
        isActive: r.is_active,
        store: store ?? r.store_id,
        seller: seller ?? r.seller_id,
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
    };

    // Lightweight projections used by getMyProducts / listings
    if (select) {
        const out = { _id: full._id };
        for (const key of select) out[key] = full[key];
        if (r.store_name !== undefined) {
            out.store = { _id: r.store_id, name: r.store_name };
        }
        return out;
    }

    if (r.store_name !== undefined) {
        full.store = { _id: r.store_id, name: r.store_name, logo: r.store_logo };
    }
    if (r.seller_name !== undefined) {
        full.seller = { _id: r.seller_id, name: r.seller_name };
    }
    return full;
};

/** Order line item (already snapshotted) → API shape. */
export const toItem = (r) => ({
    product: r.product_id,
    name: r.name,
    price: r.price,
    quantity: r.quantity,
    image: r.image ?? undefined,
    store: r.store_id,
    seller: r.seller_id,
});

/**
 * Full order row (+ optional joined customer/product/store info) → API shape.
 * `items` must already be mapped with toItem().
 */
export const toOrder = (r, { items = [], customer, productNames, storeNames } = {}) => {
    if (!r) return null;
    const order = {
        _id: r.id,
        orderNumber: r.order_number,
        customer: customer ?? r.customer_id,
        guestInfo: r.guest_info && Object.keys(r.guest_info).length ? r.guest_info : undefined,
        shippingAddress: r.shipping_address ?? {},
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        itemsPrice: r.items_price,
        shippingPrice: r.shipping_price,
        taxPrice: r.tax_price,
        totalPrice: r.total_price,
        status: r.status,
        deliveredAt: iso(r.delivered_at) ?? null,
        createdAt: iso(r.created_at),
        items: items.map((item) => {
            const shaped = toItem(item);
            if (productNames && item.product_id && productNames[item.product_id]) {
                shaped.product = {
                    _id: item.product_id,
                    name: productNames[item.product_id].name,
                    images: productNames[item.product_id].images,
                    price: productNames[item.product_id].price,
                    seller: productNames[item.product_id].seller_id,
                };
            }
            if (storeNames && item.store_id && storeNames[item.store_id]) {
                shaped.store = { _id: item.store_id, name: storeNames[item.store_id] };
            }
            return shaped;
        }),
    };
    return order;
};

export const toReview = (r, { user } = {}) => {
    if (!r) return null;
    return {
        _id: r.id,
        user: user ?? r.user_id,
        product: r.product_id,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.is_verified_purchase,
        media: r.media ?? [],
        helpfulVotes: r.helpful_votes,
        createdAt: iso(r.created_at),
        ...(r.user_name !== undefined
            ? { user: { _id: r.user_id, name: r.user_name, avatar: r.user_avatar } }
            : {}),
    };
};

export const toMessage = (r, { sender } = {}) => ({
    _id: r.id,
    roomId: r.room_id,
    sender: sender ?? r.sender_id,
    text: r.text,
    createdAt: iso(r.created_at),
});

export const toSettings = (r) => ({
    taxRate: r?.tax_rate ?? 8,
    shippingFee: r?.shipping_fee ?? 10,
    fixedFeePerOrder: r?.fixed_fee_per_order ?? 2,
    updatedBy: r?.updated_by ?? null,
    updatedAt: iso(r?.updated_at),
});
