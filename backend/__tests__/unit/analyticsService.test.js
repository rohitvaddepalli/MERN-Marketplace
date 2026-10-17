import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as analyticsService from '../../services/analyticsService.js';
import { query } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
    query: vi.fn(),
    withTransaction: vi.fn(),
    isUuid: vi.fn(),
    getPool: vi.fn(),
    setPool: vi.fn(),
    closePool: vi.fn(),
    createPool: vi.fn(),
}));

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SELLER_ITEM_WHERE', () => {
        it('should scope order items to the seller with a bound parameter', () => {
            // Replaces the old Mongo sellerItemStages() pipeline builder:
            // order_items.seller_id makes unwind+lookup unnecessary.
            expect(analyticsService.SELLER_ITEM_WHERE).toBe('oi.seller_id = $1');
        });
    });

    describe('getSalesVelocityMap', () => {
        it('should return a map of product sales velocities', async () => {
            query.mockResolvedValue({
                rows: [
                    { product_id: 'prod1', total_sold: 10 },
                    { product_id: 'prod2', total_sold: 5 },
                ],
            });

            const map = await analyticsService.getSalesVelocityMap(
                'seller1',
                ['prod1', 'prod2'],
                new Date('2023-01-01')
            );

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('FROM order_items'),
                ['seller1', ['prod1', 'prod2'], new Date('2023-01-01')]
            );
            expect(map.size).toBe(2);
            expect(map.get('prod1')).toBe(10);
            expect(map.get('prod2')).toBe(5);
        });

        it('should short-circuit for an empty product list', async () => {
            const map = await analyticsService.getSalesVelocityMap('seller1', [], new Date());
            expect(map.size).toBe(0);
            expect(query).not.toHaveBeenCalled();
        });
    });

    describe('getRevenueSummary', () => {
        it('should return revenue summary with calculated averages', async () => {
            query.mockResolvedValue({
                rows: [{ date: '2023-01-01', revenue: 100, orders: 1 }],
            });

            const result = await analyticsService.getRevenueSummary(
                { whereSql: 'o.status = $2', params: ['delivered'] },
                new Date('2023-01-01')
            );

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('FROM orders'),
                [new Date('2023-01-01'), 'delivered']
            );
            expect(result.totalRevenue).toBe(100);
            expect(result.totalOrders).toBe(1);
            expect(result.averageOrderValue).toBe(100);
            expect(result.salesData.length).toBe(1);
        });

        it('should return default values if no data', async () => {
            query.mockResolvedValue({ rows: [] });

            const result = await analyticsService.getRevenueSummary({}, new Date('2023-01-01'));

            expect(result.totalRevenue).toBe(0);
            expect(result.totalOrders).toBe(0);
            expect(result.averageOrderValue).toBe(0);
            expect(result.salesData.length).toBe(0);
        });
    });
});
