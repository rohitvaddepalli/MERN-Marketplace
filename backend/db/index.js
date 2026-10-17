/**
 * db/index.js — PostgreSQL (Neon) connection layer.
 *
 * Replaces the Mongoose connection. A single process-wide pool is shared by
 * every query; transactions check out one client so all statements of a
 * transaction hit the same backend connection (required by node-postgres, and
 * by Neon's PgBouncer transaction pooling).
 *
 * Env:
 *   DATABASE_URL  — pooled Neon connection string (runtime)
 *   (migrations use DATABASE_URL_UNPOOLED when present — see scripts/migrate-pg.js)
 */
import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Test setups inject their own pool via setPool(); production builds one from env.
let pool = null;

export const createPool = (connectionStrings) =>
    new Pool({
        connectionString: connectionStrings,
        max: parseInt(process.env.PG_POOL_SIZE || '10', 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        // Neon requires TLS; reject unauthorized is fine with Neon's certs
        ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
    });

export const setPool = (newPool) => {
    if (pool && pool !== newPool) {
        pool.end().catch(() => {});
    }
    pool = newPool;
};

export const getPool = () => {
    if (!pool) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error('DATABASE_URL is not set — cannot reach PostgreSQL');
        }
        pool = createPool(url);
        pool.on('error', (err) => logger.error({ err }, 'Unexpected Postgres pool error'));
    }
    return pool;
};

/** Run a parameterised query. `params` are bound — never interpolate user input. */
export const query = (text, params) => getPool().query(text, params);

/**
 * Run `fn(client)` inside a transaction. The same checked-out client is used
 * for every statement, so BEGIN/COMMIT/ROLLBACK actually bracket the work.
 */
export const withTransaction = async (fn) => {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch {
            /* connection already broken — original error wins */
        }
        throw err;
    } finally {
        client.release();
    }
};

/** Graceful shutdown — called from server.js shutdown handler. */
export const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};

/**
 * Cheap UUIDv4 shape check. Postgres rejects malformed uuid literals with a
 * cast error (500); the old Mongo code answered 404/400 for bad ObjectIds, so
 * controllers guard id params with this before touching SQL.
 */
export const isUuid = (value) =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
