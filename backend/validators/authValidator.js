import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Please include a valid email'),
        password: z.string().min(8, 'Please enter a password with 8 or more characters').max(128, 'Password cannot exceed 128 characters'),
        // SECURITY: Only user-assignable roles are permitted at registration.
        // 'admin' must be granted via the database or the admin panel — never
        // through the public registration endpoint (defense-in-depth with the
        // controller-level check in authController.register).
        role: z.enum(['customer', 'seller']).optional(),
        phone: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Please include a valid email'),
        password: z.string().min(1, 'Password is required'),
    }),
});
