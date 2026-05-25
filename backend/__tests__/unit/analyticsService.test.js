import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as analyticsService from '../../services/analyticsService.js';
import Order from '../../models/Order.js';

vi.mock('../../models/Order.js');

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sellerItemStages', () => {
        it('should return aggregation pipeline stages for seller', () => {
            const stages = analyticsService.sellerItemStages('seller123');
            
            expect(stages.length).toBe(4);
            expect(stages[0].$unwind).toBe('$items');
            expect(stages[3].$match).toEqual({ '_product.seller': 'seller123' });
        });
    });

    describe('getSalesVelocityMap', () => {
        it('should return a map of product sales velocities', async () => {
            Order.aggregate.mockResolvedValue([
                { _id: 'prod1', totalSold: 10 },
                { _id: 'prod2', totalSold: 5 }
            ]);

            const map = await analyticsService.getSalesVelocityMap('seller1', ['prod1', 'prod2'], new Date('2023-01-01'));
            
            expect(map.size).toBe(2);
            expect(map.get('prod1')).toBe(10);
            expect(map.get('prod2')).toBe(5);
        });
    });

    describe('getRevenueSummary', () => {
        it('should return revenue summary with calculated averages', async () => {
            Order.aggregate.mockResolvedValue([{
                salesData: [
                    { date: '2023-01-01', revenue: 100, orders: 1 }
                ],
                totalRevenue: 100,
                totalOrders: 1,
                averageOrderValue: 100
            }]);

            const result = await analyticsService.getRevenueSummary({ status: 'Delivered' }, new Date('2023-01-01'));
            
            expect(result.totalRevenue).toBe(100);
            expect(result.averageOrderValue).toBe(100);
            expect(result.salesData.length).toBe(1);
        });

        it('should return default values if no data', async () => {
            Order.aggregate.mockResolvedValue([]);

            const result = await analyticsService.getRevenueSummary({ status: 'Delivered' }, new Date('2023-01-01'));
            
            expect(result.totalRevenue).toBe(0);
            expect(result.totalOrders).toBe(0);
            expect(result.averageOrderValue).toBe(0);
            expect(result.salesData.length).toBe(0);
        });
    });
});
