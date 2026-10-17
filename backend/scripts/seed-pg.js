/**
 * seed-pg.js — idempotent demo data for PostgreSQL.
 *
 *   npm run seed
 *   npm run migrate -- --seed
 *
 * Replaces the browser-side Firestore seeder (frontend/src/utils/seeder.js):
 * seeding now happens server-side against the same database the API uses.
 *
 * Creates (only if missing):
 *   - an admin profile  (ADMIN_EMAIL, default admin@marketplace.dev)
 *   - a seller profile  (SELLER_EMAIL, default seller@marketplace.dev)
 *   - that seller's store
 *   - a handful of sample products
 *
 * NOTE: authentication is handled by Clerk — these rows are application
 * profiles linked by clerk_user_id once the user signs up (or immediately if
 * you set clerk_user_id via CLERK_USER_ID).
 */
import 'dotenv/config';
import { seed as runSeed } from '../db/seed.js';

const seed = async (pool) => runSeed(pool);

// Allow `node scripts/seed-pg.js` directly as well as `--seed` from the runner.
if (process.argv[1] && process.argv[1].endsWith('seed-pg.js')) {
    const pg = await import('pg');
    const connection = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!connection) {
        console.error('ERROR: set DATABASE_URL before seeding.');
        process.exit(1);
    }
    const pool = new pg.Pool({
        connectionString: connection,
        ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
    try {
        await seed(pool);
    } finally {
        await pool.end();
    }
}

export { seed };
