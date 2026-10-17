import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as productService from '../../services/productService.js';
import { query } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
    query: vi.fn(),
    withTransaction: vi.fn(),
    isUuid: (v) =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    getPool: vi.fn(),
    setPool: vi.fn(),
    closePool: vi.fn(),
    createPool: vi.fn(),
}));

const row = (overrides = {}) => ({
    id: 'prod-1',
    name: 'Test',
    description: 'desc',
    price: 10,
    category: 'Electronics',
    images: [],
    stock: 5,
    tags: [],
    specifications: {},
    variants: [],
    low_stock_threshold: 10,
    bulk_discounts: [],
    is_active: true,
    store_id: 'store-1',
    seller_id: 'seller-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
});

describe('productService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProductById', () => {
        it('should SELECT the product and map it to API shape', async () => {
            query.mockResolvedValue({ rows: [row()] });

            const result = await productService.getProductById('prod-1');

            expect(query).toHaveBeenCalledWith('SELECT * FROM products WHERE id = $1', ['prod-1']);
            expect(result._id).toBe('prod-1');
            expect(result.name).toBe('Test');
        });

        it('should return null when not found', async () => {
            query.mockResolvedValue({ rows: [] });
            const result = await productService.getProductById('missing');
            expect(result).toBeNull();
        });
    });

    describe('isProductOwnedBySeller', () => {
        it('should return true if seller owns the product', async () => {
            query.mockResolvedValue({ rows: [{ seller_id: 'seller123' }] });

            const result = await productService.isProductOwnedBySeller('prod123', 'seller123');

            expect(query).toHaveBeenCalledWith(
                'SELECT seller_id FROM products WHERE id = $1',
                ['prod123']
            );
            expect(result).toBe(true);
        });

        it('should return false for a different seller', async () => {
            query.mockResolvedValue({ rows: [{ seller_id: 'someone-else' }] });
            const result = await productService.isProductOwnedBySeller('prod123', 'seller123');
            expect(result).toBe(false);
        });

        it('should return false if product does not exist', async () => {
            query.mockResolvedValue({ rows: [] });
            const result = await productService.isProductOwnedBySeller('prod123', 'seller123');
            expect(result).toBe(false);
        });
    });

    describe('createProduct', () => {
        it('should INSERT and return the mapped product', async () => {
            query.mockResolvedValue({ rows: [row({ name: 'New' })] });

            const result = await productService.createProduct({
                store: 'store-1',
                seller: 'seller-1',
                name: 'New',
                description: 'desc',
                price: 10,
                category: 'Electronics',
            });

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO products'),
                expect.arrayContaining(['store-1', 'seller-1', 'New'])
            );
            expect(result._id).toBe('prod-1');
            expect(result.name).toBe('New');
        });
    });

    describe('updateProductBySeller', () => {
        it('should UPDATE only when the seller owns the product', async () => {
            query.mockResolvedValue({ rows: [row({ name: 'Test Updated' })] });

            const result = await productService.updateProductBySeller('prod-1', 'seller-1', {
                name: 'Test Updated',
            });

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE products SET'),
                expect.arrayContaining(['Test Updated', 'prod-1', 'seller-1'])
            );
            expect(result.name).toBe('Test Updated');
        });

        it('should return null when ownership does not match', async () => {
            query.mockResolvedValue({ rows: [] });
            const result = await productService.updateProductBySeller('prod-1', 'other', {
                name: 'X',
            });
            expect(result).toBeNull();
        });
    });

    describe('deactivateProductBySeller', () => {
        it('should soft-delete via is_active = false', async () => {
            query.mockResolvedValue({ rows: [row({ is_active: false })] });

            const result = await productService.deactivateProductBySeller('prod-1', 'seller-1');

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('is_active = false'),
                ['prod-1', 'seller-1']
            );
            expect(result.isActive).toBe(false);
        });
    });
});
