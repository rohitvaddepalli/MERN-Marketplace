import { z } from 'zod';

export const orderSchema = z.object({
    body: z.object({
        items: z.array(
            z.object({
                product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
                store: z.string().optional(),
                quantity: z.number().int().min(1, 'Quantity must be at least 1'),
            })
        ).min(1, 'At least one item is required'),
        shippingAddress: z.object({
            street: z.string().min(1, 'Street is required'),
            city: z.string().min(1, 'City is required'),
            zipCode: z.string().min(1, 'Zip code is required'),
            country: z.string().min(1, 'Country is required'),
            state: z.string().optional(),
        }),
        paymentMethod: z.enum(['card', 'paypal', 'cod'], {
            errorMap: () => ({ message: 'Valid payment method is required' }),
        }),
        itemsPrice: z.number().optional(),
        shippingPrice: z.number().optional(),
        taxPrice: z.number().optional(),
        totalPrice: z.number().optional(),
        guestInfo: z.object({
            email: z.string().email('Invalid email format').optional(),
            name: z.string().optional(),
        }).optional(),
    }).passthrough(),
});

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
            errorMap: () => ({ message: 'Valid status is required' }),
        }),
    }).passthrough(),
});
