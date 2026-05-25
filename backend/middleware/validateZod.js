import { z } from 'zod';

export const validateZod = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation failed',
                errors: error.errors,
            });
        }
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
        });
    }
};
