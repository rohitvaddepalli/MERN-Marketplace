import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('resend', () => {
    return {
        Resend: vi.fn().mockImplementation(function () {
            this.emails = {
                send: mockSend,
            };
        }),
    };
});

vi.mock('../../utils/logger.js', () => ({
    default: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('sendEmail utility', () => {
    const originalEnv = process.env;

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env = { ...originalEnv, RESEND_API_KEY: 're_test_123' };
        const { emailBreaker } = await import('../../utils/sendEmail.js');
        if (emailBreaker.opened) {
            emailBreaker.close();
        }
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should throw error when RESEND_API_KEY is missing', async () => {
        delete process.env.RESEND_API_KEY;
        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        await expect(
            sendEmail({
                email: 'test@example.com',
                subject: 'Test',
                message: '<p>Hi</p>',
            })
        ).rejects.toThrow('RESEND_API_KEY not configured');
    });

    it('should send email successfully', async () => {
        mockSend.mockResolvedValueOnce({
            data: { id: 'email_123' },
            error: null,
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        await expect(
            sendEmail({
                email: 'customer@example.com',
                subject: 'Welcome',
                message: '<p>Welcome!</p>',
            })
        ).resolves.not.toThrow();

        expect(mockSend).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'customer@example.com',
                subject: 'Welcome',
                html: '<p>Welcome!</p>',
            })
        );
    });

    it('should preserve and propagate permanent 4xx errors to callers', async () => {
        mockSend.mockResolvedValueOnce({
            data: null,
            error: {
                statusCode: 422,
                name: 'missing_required_field',
                message: "Missing 'to' field",
            },
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        const promise = sendEmail({
            email: 'bad@example.com',
            subject: 'Test',
            message: '<p>Hi</p>',
        });

        await expect(promise).rejects.toMatchObject({
            message: "Missing 'to' field",
            statusCode: 422,
            name: 'missing_required_field',
        });
    });

    it('should propagate 403 domain unverified error to callers', async () => {
        mockSend.mockResolvedValueOnce({
            data: null,
            error: {
                statusCode: 403,
                name: 'domain_not_verified',
                message: 'Domain not verified',
            },
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        await expect(
            sendEmail({
                email: 'user@example.com',
                subject: 'Test',
                message: '<p>Hi</p>',
            })
        ).rejects.toMatchObject({
            message: 'Domain not verified',
            statusCode: 403,
            name: 'domain_not_verified',
        });
    });

    it('should propagate validation error without statusCode as 400', async () => {
        mockSend.mockResolvedValueOnce({
            data: null,
            error: {
                name: 'validation_error',
                message: 'Invalid email format',
            },
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        await expect(
            sendEmail({
                email: 'invalid-email',
                subject: 'Test',
                message: '<p>Hi</p>',
            })
        ).rejects.toMatchObject({
            message: 'Invalid email format',
            statusCode: 400,
            name: 'validation_error',
        });
    });

    it('should suppress 503 service unavailable errors after logging a warning', async () => {
        const logger = (await import('../../utils/logger.js')).default;
        mockSend.mockResolvedValueOnce({
            data: null,
            error: {
                statusCode: 503,
                name: 'service_unavailable',
                message: 'Resend is down',
            },
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        const result = await sendEmail({
            email: 'user@example.com',
            subject: 'Test',
            message: '<p>Hi</p>',
        });

        expect(result).toBeUndefined();
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('[Email] Service unavailable')
        );
    });

    it('should treat network fetch failures (statusCode null) as 503 service unavailable and suppress', async () => {
        const logger = (await import('../../utils/logger.js')).default;
        mockSend.mockResolvedValueOnce({
            data: null,
            error: {
                statusCode: null,
                name: 'application_error',
                message: 'Unable to fetch data. The request could not be resolved.',
            },
        });

        const { default: sendEmail } = await import('../../utils/sendEmail.js');

        const result = await sendEmail({
            email: 'user@example.com',
            subject: 'Test',
            message: '<p>Hi</p>',
        });

        expect(result).toBeUndefined();
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('[Email] Service unavailable')
        );
    });

    it('should suppress and log warning when circuit breaker is open', async () => {
        const logger = (await import('../../utils/logger.js')).default;
        const { default: sendEmail, emailBreaker } = await import('../../utils/sendEmail.js');

        emailBreaker.open();

        const result = await sendEmail({
            email: 'user@example.com',
            subject: 'Test',
            message: '<p>Hi</p>',
        });

        expect(result).toBeUndefined();
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('[Email] Service unavailable')
        );
    });
});
