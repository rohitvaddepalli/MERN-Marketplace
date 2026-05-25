import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Please include a valid email'),
        password: z.string().min(6, 'Please enter a password with 6 or more characters'),
        role: z.enum(['customer', 'seller', 'admin']).optional(),
        phone: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Please include a valid email'),
        password: z.string().min(1, 'Password is required'),
    }),
});
