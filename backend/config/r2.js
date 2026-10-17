/**
 * config/r2.js — Cloudflare R2 (S3-compatible) upload helpers.
 *
 * Replaces the old Cloudinary integration. Files are written either:
 *   - through the API (POST /api/upload, multer memory → PutObject), or
 *   - directly from the browser via a presigned PUT URL
 *     (GET /api/upload/signature) so large files never proxy through the
 *     backend — the same reason the Cloudinary signature endpoint existed.
 *
 * Required env: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *               R2_BUCKET, R2_PUBLIC_URL (public custom domain or r2.dev URL)
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const REQUIRED = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];

export const isR2Configured = () => REQUIRED.every((k) => !!process.env[k]);

let client;
const getClient = () => {
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return client;
};

const EXT_BY_TYPE = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
};

/** Safe, unique object key for an incoming upload. */
export const buildObjectKey = (mimetype) => {
    const ext = EXT_BY_TYPE[mimetype] ?? 'bin';
    return `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
};

/** Public URL for an object key (bucket must be public via custom domain/r2.dev). */
export const publicUrl = (key) => {
    const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    return base ? `${base}/${key}` : key;
};

/** Server-side upload from a Buffer (POST /api/upload path). */
export const uploadBuffer = async ({ key, body, contentType, cacheControl }) => {
    await getClient().send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: cacheControl || 'public, max-age=31536000, immutable',
        })
    );
    return { key, url: publicUrl(key) };
};

/**
 * Presigned PUT URL so the browser can upload straight to R2.
 * Valid for 10 minutes; the URL is scoped to a single key.
 */
export const presignPut = async ({ key, contentType }) => {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 600 });
    return { uploadUrl, key, publicUrl: publicUrl(key) };
};
