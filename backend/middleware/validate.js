import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorArr = errors.array();
        return res.status(400).json({
            success: false,
            message: errorArr.map(err => err.msg).join(', '),
            errors: errorArr.map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};
