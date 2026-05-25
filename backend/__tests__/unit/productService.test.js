import { vi, describe, it, expect, beforeEach } from 'vitest';
import Product from '../../models/Product.js';
import * as productService from '../../services/productService.js';

vi.mock('../../models/Product.js');

describe('productService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProductById', () => {
        it('should call Product.findById', async () => {
            const mockProduct = { _id: '123', name: 'Test' };
            Product.findById.mockResolvedValue(mockProduct);

            const result = await productService.getProductById('123');

            expect(Product.findById).toHaveBeenCalledWith('123');
            expect(result).toEqual(mockProduct);
        });
    });

    describe('isProductOwnedBySeller', () => {
        it('should return true if seller owns the product', async () => {
            Product.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ seller: 'seller123' })
            });

            const result = await productService.isProductOwnedBySeller('prod123', 'seller123');

            expect(result).toBe(true);
            expect(Product.findById).toHaveBeenCalledWith('prod123');
        });

        it('should return false if product does not exist', async () => {
            Product.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue(null)
            });

            const result = await productService.isProductOwnedBySeller('prod123', 'seller123');

            expect(result).toBe(false);
        });
    });

    describe('createProduct', () => {
        it('should call Product.create', async () => {
            const mockData = { name: 'Test' };
            Product.create.mockResolvedValue(mockData);

            const result = await productService.createProduct(mockData);

            expect(Product.create).toHaveBeenCalledWith(mockData);
            expect(result).toEqual(mockData);
        });
    });

    describe('updateProductBySeller', () => {
        it('should call Product.findOneAndUpdate', async () => {
            const mockData = { name: 'Test Updated' };
            Product.findOneAndUpdate.mockResolvedValue(mockData);

            const result = await productService.updateProductBySeller('prod1', 'seller1', { name: 'Test Updated' });

            expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'prod1', seller: 'seller1' },
                { name: 'Test Updated' },
                { new: true, runValidators: true }
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('deactivateProductBySeller', () => {
        it('should call Product.findOneAndUpdate to deactivate', async () => {
            Product.findOneAndUpdate.mockResolvedValue({ isActive: false });

            const result = await productService.deactivateProductBySeller('prod1', 'seller1');

            expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'prod1', seller: 'seller1' },
                { isActive: false },
                { new: true }
            );
            expect(result.isActive).toBe(false);
        });
    });
});
