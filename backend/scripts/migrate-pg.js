/**
 * migrate-pg.js — applies SQL migrations from backend/migrations/ in order.
 *
 *   npm run migrate            # apply pending migrations
 *   npm run migrate -- --seed  # apply migrations, then seed demo data
 *
 * Uses DATABASE_URL_UNPOOLED when present (Neon recommends the direct URL for
 * schema tooling; the pooled URL is for runtime queries). Each file runs inside
 * its own transaction and is recorded in schema_migrations.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const connection =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connection) {
    console.error(
        'ERROR: set DATABASE_URL (or DATABASE_URL_UNPOOLED) before running migrations.'
    );
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: connection,
    ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
});

const ensureMigrationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename   text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    `);
};

const appliedMigrations = async () => {
    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    return new Set(rows.map((r) => r.filename));
};

const run = async () => {
    await ensureMigrationsTable();
    const applied = await appliedMigrations();
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    let ran = 0;
    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`✅ applied ${file}`);
            ran++;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`❌ failed  ${file}: ${err.message}`);
            throw err;
        } finally {
            client.release();
        }
    }

    if (ran === 0) console.log('No pending migrations.');

    if (process.argv.includes('--seed')) {
        const { seed } = await import('./seed-pg.js');
        await seed(pool);
    }

    await pool.end();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
