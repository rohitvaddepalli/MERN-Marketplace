import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const recipient = process.env.TEST_EMAIL_RECIPIENT || process.argv[2];
if (!recipient) {
    console.error('ERROR: specify a recipient via TEST_EMAIL_RECIPIENT env var or CLI argument.');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

resend.emails
    .send({
        from: process.env.RESEND_FROM || 'Marketplace <onboarding@resend.dev>',
        to: recipient,
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    })
    .then((data) => {
        console.log('Email sent successfully:', data);
    })
    .catch((error) => {
        console.error('Error sending email:', error);
    });
