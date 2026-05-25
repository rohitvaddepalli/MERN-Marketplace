import { z } from 'zod';

export const updateSettingsSchema = z.object({
    body: z.object({
        taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100').optional(),
        shippingFee: z.number().min(0, 'Shipping fee cannot be negative').optional(),
        fixedFeePerOrder: z.number().min(0, 'Fixed fee per order cannot be negative').optional(),
    }).passthrough(),
});

export const updateStoreStatusSchema = z.object({
    body: z.object({
        isActive: z.boolean({ required_error: 'isActive is required' }),
    }).passthrough(),
});
