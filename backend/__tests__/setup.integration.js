/**
 * setup.integration.js — integration tests run against PostgreSQL (Neon).
 *
 * Replaces the old MongoMemoryServer setup:
 *   - Connects to DATABASE_URL_UNPOOLED (startup params like search_path are
 *     rejected by Neon's pooled endpoint) with search_path pinned to a
 *     dedicated `app_test` schema, so tests never touch the public schema.
 *   - Recreates that schema and applies backend/migrations/*.sql before each
 *     test file, then truncates every table between tests.
 *   - Auth: Clerk owns sign-in in production; tests can't mint real Clerk
 *     sessions, so they inject an identity through the NODE_ENV=test-only
 *     seam (setAuthResolverForTests) using the existing cookie helpers.
 *     The resolver reads the access_token cookie and loads the matching
 *     users row — roles/ownership are still enforced from the database.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { setPool, query, isUuid } from '../db/index.js';
import { setAuthResolverForTests } from '../middleware/auth.js';
import cache from '../utils/cache.js';

dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-testing-12345';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.SMTP_EMAIL = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.FRONTEND_URL = 'http://localhost:3000';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const TEST_SCHEMA = 'app_test';

const connection = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connection) {
    throw new Error(
        'Integration tests require DATABASE_URL (or DATABASE_URL_UNPOOLED) in backend/.env'
    );
}

let pool = null;

/**
 * Test identity injection. The request carries `access_token=<user uuid>` —
 * either from getAuthCookie() in tests or a bare session. Returns the same
 * profile shape `protect` builds for a real Clerk session.
 */
const testAuthResolver = async (req) => {
    const header = req.headers.cookie || '';
    const match = header.match(/(?:^|;\s*)access_token=([^;\s]+)/);
    if (!match) return null;

    const userId = decodeURIComponent(match[1]);
    if (!isUuid(userId)) return null;

    const { rows } = await query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [userId]
    );
    if (!rows[0]) return null;

    return {
        _id: rows[0].id,
        role: rows[0].role,
        name: rows[0].name,
        email: rows[0].email,
        clerkId: null,
    };
};

const applyMigrations = async (targetPool) => {
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await targetPool.query(sql);
    }
};

beforeAll(async () => {
    // Fresh schema per test file → fixtures from other files never leak in.
    const bootstrap = new pg.Pool({
        connectionString: connection,
        ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 2,
        connectionTimeoutMillis: 20000,
    });
    await bootstrap.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
    await bootstrap.query(`CREATE SCHEMA ${TEST_SCHEMA}`);
    await bootstrap.end();

    // search_path is a startup parameter — must be set on the pool itself.
    pool = new pg.Pool({
        connectionString: connection,
        ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
        max: 4,
        connectionTimeoutMillis: 20000,
        options: `-c search_path=${TEST_SCHEMA}`,
    });

    await applyMigrations(pool);

    // Hand the app its test pool (db/index.js is a process-wide singleton).
    setPool(pool);

    // Bypass Clerk: resolve identities from the test cookie instead.
    setAuthResolverForTests(testAuthResolver);
}, 120000);

afterEach(async () => {
    // Deterministic state: no cross-test cache hits (admin stats, lists, …)
    await cache.delPattern('*');

    const { rows } = await query(
        "SELECT tablename FROM pg_tables WHERE schemaname = $1",
        [TEST_SCHEMA]
    );
    if (rows.length > 0) {
        const targets = rows.map((r) => `"${TEST_SCHEMA}"."${r.tablename}"`).join(', ');
        await query(`TRUNCATE ${targets} RESTART IDENTITY CASCADE`);
    }
});

afterAll(async () => {
    if (pool) {
        await pool.end();
        pool = null;
    }
});
