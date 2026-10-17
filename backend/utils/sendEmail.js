import { Resend } from 'resend';
import { createCircuitBreaker } from './circuitBreaker.js';
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
        throw Object.assign(new Error(error.message || 'Resend send failed'), {
            statusCode: 503,
        });
    }
};

const emailBreaker = createCircuitBreaker(sendEmailFn, 'sendEmail');

const sendEmail = async (options) => {
    try {
        return await emailBreaker.fire(options);
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

export default sendEmail;
