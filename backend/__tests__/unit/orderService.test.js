import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as orderService from '../../services/orderService.js';
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

describe('orderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyOrderItems', () => {
        it('should verify available items and return errors for missing/unavailable', async () => {
            // SQL returns snake_case rows keyed by product id
            query.mockResolvedValue({
                rows: [
                    { id: 'prod1', name: 'Product 1', is_active: true, stock: 10 },
                    { id: 'prod2', name: 'Product 2', is_active: false, stock: 10 },
                    { id: 'prod3', name: 'Product 3', is_active: true, stock: 2 },
                ],
            });

            const items = [
                { product: 'prod1', quantity: 5, price: 100 },
                { product: 'prod2', quantity: 5, price: 100 },
                { product: 'prod3', quantity: 5, price: 100 },
                { product: 'prod4', quantity: 5, price: 100 },
            ];

            const result = await orderService.verifyOrderItems(items);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('FROM products WHERE id = ANY'),
                [['prod1', 'prod2', 'prod3', 'prod4']]
            );
            expect(result.verified.length).toBe(1);
            expect(result.verified[0].item.product).toBe('prod1');

            expect(result.errors.length).toBe(3);
            expect(result.errors).toContain('Product prod4 not found');
            expect(result.errors).toContain('Product "Product 2" is no longer available');
            expect(result.errors).toContain(
                'Insufficient stock for "Product 3": requested 5, available 2'
            );
        });

        it('should not query when there are no items', async () => {
            const result = await orderService.verifyOrderItems([]);
            expect(result.verified).toEqual([]);
            expect(result.errors).toEqual([]);
        });
    });

    describe('getBulkDiscountPercentage', () => {
        it('should return 0 if no bulk discounts', () => {
            expect(orderService.getBulkDiscountPercentage({}, 10)).toBe(0);
        });

        it('should return the best applicable discount', () => {
            const product = {
                bulkDiscounts: [
                    { quantity: 5, discountPercentage: 10 },
                    { quantity: 10, discountPercentage: 20 },
                    { quantity: 20, discountPercentage: 30 },
                ],
            };

            expect(orderService.getBulkDiscountPercentage(product, 4)).toBe(0);
            expect(orderService.getBulkDiscountPercentage(product, 5)).toBe(10);
            expect(orderService.getBulkDiscountPercentage(product, 15)).toBe(20);
            expect(orderService.getBulkDiscountPercentage(product, 25)).toBe(30);
        });

        it('should accept snake_case bulk_discounts from raw rows', () => {
            const product = {
                bulk_discounts: [{ quantity: 3, discountPercentage: 15 }],
            };
            expect(orderService.getBulkDiscountPercentage(product, 3)).toBe(15);
        });
    });

    describe('updateOrderFields', () => {
        it('should run a targeted UPDATE and map the row to API shape', async () => {
            query.mockResolvedValue({
                rows: [
                    {
                        id: 'order1',
                        order_number: 'ORD-1',
                        status: 'delivered',
                        payment_status: 'pending',
                        payment_method: 'cod',
                        items_price: 10,
                        shipping_price: 0,
                        tax_price: 0,
                        total_price: 10,
                        shipping_address: {},
                        items: [],
                    },
                ],
            });

            const result = await orderService.updateOrderFields('order1', {
                status: 'delivered',
            });

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE orders SET status = $1'),
                ['delivered', 'order1']
            );
            expect(result.status).toBe('delivered');
            expect(result._id).toBe('order1');
        });

        it('should return the order without an UPDATE when no fields change', async () => {
            query.mockResolvedValue({
                rows: [{ id: 'order1', status: 'pending', shipping_address: {}, items: [] }],
            });

            const result = await orderService.updateOrderFields('order1', {});

            expect(query).toHaveBeenCalledWith('SELECT * FROM orders WHERE id = $1', ['order1']);
            expect(result._id).toBe('order1');
        });

        it('should return null when the order does not exist', async () => {
            query.mockResolvedValue({ rows: [] });
            const result = await orderService.updateOrderFields('nope', { status: 'shipped' });
            expect(result).toBeNull();
        });
    });
});
