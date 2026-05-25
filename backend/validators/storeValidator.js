import { z } from 'zod';

export const storeSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Store name is required').max(50, 'Name cannot exceed 50 characters'),
        description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters'),
        category: z.string().min(1, 'Category is required'),
        address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        contact: z.object({
            email: z.string().email('Please include a valid email').optional(),
            phone: z.string().optional(),
        }).optional(),
        logo: z.string().optional(),
        banner: z.string().optional(),
    }).passthrough(),
});
