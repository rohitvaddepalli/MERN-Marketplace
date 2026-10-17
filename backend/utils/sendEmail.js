import { Resend } from 'resend';
import { createCircuitBreaker, handleWithBreaker } from './circuitBreaker.js';
import logger from './logger.js';

/**
 * sendEmail.js — transactional email via Resend (replaces nodemailer/SMTP).
 *
 * Same options shape as before: { email, subject, message(html) }.
 * Env: RESEND_API_KEY (required), RESEND_FROM (sender, e.g.
 * "Marketplace <orders@example.com>"; defaults to Resend's test sender).
 */
let resendClient;
const getClient = () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured. Cannot send email.');
    }
    if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
};

const sendEmailFn = async (options) => {
    const from =
        process.env.RESEND_FROM || 'Marketplace <onboarding@resend.dev>';

    const { error } = await getClient().emails.send({
        from,
        to: options.email,
        subject: options.subject,
        html: options.message,
    });
    if (error) {
        const statusCode =
            error.statusCode ||
            error.status ||
            (error.name === 'validation_error' ||
            error.name === 'invalid_parameter' ||
            error.name === 'missing_required_field'
                ? 400
                : 503);
        const err = error instanceof Error ? error : new Error(error.message || 'Resend send failed');
        throw Object.assign(err, error, { statusCode });
    }
};

const emailBreaker = createCircuitBreaker(sendEmailFn, 'sendEmail', {
    errorFilter: (err) =>
        (err.statusCode && err.statusCode < 500) ||
        err.message?.includes('RESEND_API_KEY not configured'),
});

const sendEmail = async (options) => {
    try {
        return await handleWithBreaker(emailBreaker, options);
    } catch (err) {
        if (err.statusCode === 503) {
            logger.warn(
                `[Email] Service unavailable, email to ${options.email} not sent: ${err.message}`
            );
            return;
        }
        throw err;
    }
};

export { emailBreaker, sendEmailFn };
export default sendEmail;
