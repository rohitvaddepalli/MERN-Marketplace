/**
 * Redis caching utility
 *
 * Uses ioredis when REDIS_URL is configured; falls back to an in-process
 * Map so the app never fails to start in environments without Redis.
 *
 * Usage:
 *   import cache from '../utils/cache.js';
 *   await cache.set('key', value, 60);   // TTL in seconds
 *   const hit = await cache.get('key');  // null on miss
 *   await cache.del('key');
 *   await cache.delPattern('products:*');
 */

import logger from './logger.js';

// ── In-memory fallback ────────────────────────────────────────────────────────
class MemoryCache {
    constructor() {
        this._store = new Map(); // key → { value, expiresAt }
    }

    async get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._store.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key, value, ttlSeconds = 60) {
        this._store.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
    }

    async del(key) {
        this._store.delete(key);
    }

    async delPattern(pattern) {
        // Convert glob-style pattern to regex
        const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this._store.keys()) {
            if (re.test(key)) this._store.delete(key);
        }
    }

    get type() {
        return 'memory';
    }
}

// ── Redis adapter ─────────────────────────────────────────────────────────────
class RedisCache {
    constructor(client) {
        this._client = client;
    }

    async get(key) {
        const raw = await this._client.get(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }

    async set(key, value, ttlSeconds = 60) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this._client.set(key, serialized, 'EX', ttlSeconds);
        } else {
            await this._client.set(key, serialized);
        }
    }

    async del(key) {
        await this._client.del(key);
    }

    async delPattern(pattern) {
        const keys = await this._client.keys(pattern);
        if (keys.length > 0) {
            await this._client.del(...keys);
        }
    }

    get type() {
        return 'redis';
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function createCache() {
    if (!process.env.REDIS_URL) {
        logger.warn(
            'REDIS_URL not set — using in-memory cache (not suitable for multi-instance deployments)'
        );
        return new MemoryCache();
    }

    try {
        // Dynamic import so the app starts even if ioredis is absent
        const { default: Redis } = await import('ioredis');
        const client = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
        });

        await new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
        });

        logger.info('Redis connected successfully');
        return new RedisCache(client);
    } catch (err) {
        logger.warn(
            { err: err.message },
            'Redis connection failed — falling back to in-memory cache'
        );
        return new MemoryCache();
    }
}

// Singleton — shared across all imports
const cache = await createCache();

export default cache;
