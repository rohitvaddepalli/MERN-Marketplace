import { z } from 'zod';

export const productSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Product name is required').max(100, 'Name cannot exceed 100 characters'),
        description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
        price: z.number().min(0, 'Price must be a positive number'),
        stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
        category: z.string().min(1, 'Category is required'),
    }).passthrough(),
});

export const reviewSchema = z.object({
    body: z.object({
        rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
        comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
        media: z.array(
            z.object({
                url: z.string(),
                type: z.enum(['image', 'video']),
            })
        ).max(5, 'Media must be an array of at most 5 items').optional(),
    }).passthrough(),
});
