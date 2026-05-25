import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as orderService from '../../services/orderService.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';

vi.mock('../../models/Product.js');
vi.mock('../../models/Order.js');

describe('orderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyOrderItems', () => {
        it('should verify available items and return errors for missing/unavailable', async () => {
            Product.find.mockResolvedValue([
                { _id: 'prod1', name: 'Product 1', isActive: true, stock: 10 },
                { _id: 'prod2', name: 'Product 2', isActive: false, stock: 10 },
                { _id: 'prod3', name: 'Product 3', isActive: true, stock: 2 }
            ]);

            const items = [
                { product: 'prod1', quantity: 5, price: 100 },
                { product: 'prod2', quantity: 5, price: 100 },
                { product: 'prod3', quantity: 5, price: 100 },
                { product: 'prod4', quantity: 5, price: 100 }
            ];

            const result = await orderService.verifyOrderItems(items);

            expect(result.verified.length).toBe(1);
            expect(result.verified[0].item.product).toBe('prod1');
            
            expect(result.errors.length).toBe(3);
            expect(result.errors).toContain('Product prod4 not found');
            expect(result.errors).toContain('Product "Product 2" is no longer available');
            expect(result.errors).toContain('Insufficient stock for "Product 3": requested 5, available 2');
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
                    { quantity: 20, discountPercentage: 30 }
                ]
            };
            
            expect(orderService.getBulkDiscountPercentage(product, 4)).toBe(0);
            expect(orderService.getBulkDiscountPercentage(product, 5)).toBe(10);
            expect(orderService.getBulkDiscountPercentage(product, 15)).toBe(20);
            expect(orderService.getBulkDiscountPercentage(product, 25)).toBe(30);
        });
    });

    describe('updateOrderFields', () => {
        it('should call Order.findByIdAndUpdate with $set', async () => {
            Order.findByIdAndUpdate.mockResolvedValue({ _id: 'order1', status: 'Delivered' });

            const result = await orderService.updateOrderFields('order1', { status: 'Delivered' });

            expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
                'order1',
                { $set: { status: 'Delivered' } },
                { new: true }
            );
            expect(result.status).toBe('Delivered');
        });
    });
});
