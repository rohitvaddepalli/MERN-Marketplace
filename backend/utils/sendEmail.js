import nodemailer from 'nodemailer';
import { createCircuitBreaker } from './circuitBreaker.js';

const sendEmailFn = async (options) => {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        throw new Error('SMTP credentials not configured. Cannot send email.');
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `${process.env.FROM_NAME || 'Marketplace'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    await transporter.sendMail(mailOptions);
};

const emailBreaker = createCircuitBreaker(sendEmailFn, 'sendEmail');

const sendEmail = async (options) => {
    try {
        return await emailBreaker.fire(options);
    } catch (err) {
        if (err.statusCode === 503) {
            console.error(
                `[Email] Service unavailable, email to ${options.email} queued for retry`
            );
            return;
        }
        throw err;
    }
};

export default sendEmail;
