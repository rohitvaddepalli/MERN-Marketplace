/**
 * db/seed.js — the actual seeding logic, callable with any pg Pool
 * (scripts/seed-pg.js and `migrate-pg --seed` both use it).
 */

const SAMPLE_PRODUCTS = [
    {
        name: 'Wireless Noise-Canceling Headphones',
        description:
            'Experience premium sound with our latest noise-canceling technology. Perfect for travelers and audiophiles.',
        price: 299.99,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
        stock: 50,
        rating: 4.8,
        reviewCount: 124,
        brand: 'TechWorld',
    },
    {
        name: 'Minimalist Leather Backpack',
        description:
            'Handcrafted from genuine leather. Sleek design fits 15-inch laptops comfortably.',
        price: 129.5,
        category: 'Fashion',
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6262?w=500&q=80'],
        stock: 20,
        rating: 4.5,
        reviewCount: 45,
        brand: 'LeatherCo',
    },
    {
        name: 'Smart Fitness Watch',
        description:
            'Track your health metrics, sleep, and workouts with precision. Waterproof and 7-day battery life.',
        price: 89.99,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
        stock: 100,
        rating: 4.2,
        reviewCount: 89,
        brand: 'TechWorld',
    },
    {
        name: 'Organic Coffee Beans (1kg)',
        description:
            'Sourced from the highlands of Ethiopia. Rich, dark roast with notes of chocolate and berry.',
        price: 24.0,
        category: 'Groceries',
        images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80'],
        stock: 200,
        rating: 4.9,
        reviewCount: 210,
        brand: 'BeanMasters',
    },
    {
        name: 'Ceramic Plant Pot Set',
        description:
            'Set of 3 minimalist ceramic pots. Perfect for succulents and small indoor plants.',
        price: 35.0,
        category: 'Home & Garden',
        images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80'],
        stock: 45,
        rating: 4.7,
        reviewCount: 32,
        brand: 'HomeDecor',
    },
];

const ensureUser = async (pool, { email, name, role }) => {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return existing.rows[0].id;

    const { rows } = await pool.query(
        `INSERT INTO users (clerk_user_id, name, email, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [process.env.CLERK_SEED_USER_ID || null, name, email, role]
    );
    console.log(`  + ${role}: ${email}`);
    return rows[0].id;
};

export const seed = async (pool) => {
    console.log('Seeding PostgreSQL…');

    const adminId = await ensureUser(pool, {
        email: process.env.ADMIN_EMAIL || 'admin@marketplace.dev',
        name: 'Platform Admin',
        role: 'admin',
    });

    const sellerId = await ensureUser(pool, {
        email: process.env.SELLER_EMAIL || 'seller@marketplace.dev',
        name: 'Demo Seller',
        role: 'seller',
    });

    // Seller's store (one per seller — enforced by UNIQUE(owner_id))
    let storeId;
    const existingStore = await pool.query('SELECT id FROM stores WHERE owner_id = $1', [sellerId]);
    if (existingStore.rows.length > 0) {
        storeId = existingStore.rows[0].id;
    } else {
        const { rows } = await pool.query(
            `INSERT INTO stores (owner_id, name, description, category)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [sellerId, 'Demo Store', 'Sample listings created by the seed script.', 'General']
        );
        storeId = rows[0].id;
        console.log('  + store: Demo Store');
    }

    // Products — only when the catalog is empty, so re-running stays idempotent
    const { rowCount } = await pool.query('SELECT 1 FROM products LIMIT 1');
    if (rowCount === 0) {
        for (const p of SAMPLE_PRODUCTS) {
            await pool.query(
                `INSERT INTO products
                   (store_id, seller_id, name, description, price, category, images,
                    stock, rating, review_count, brand, is_active)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
                [
                    storeId,
                    sellerId,
                    p.name,
                    p.description,
                    p.price,
                    p.category,
                    p.images,
                    p.stock,
                    p.rating,
                    p.reviewCount,
                    p.brand,
                ]
            );
        }
        console.log(`  + ${SAMPLE_PRODUCTS.length} sample products`);
    }

    console.log(
        `Seed complete (admin=${adminId}, seller=${sellerId}).\n` +
            'NOTE: sign-in is handled by Clerk — these rows link up via clerk_user_id.'
    );
};
