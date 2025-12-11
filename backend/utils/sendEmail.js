import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // SECURITY: Validate SMTP credentials are configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        throw new Error('SMTP credentials not configured. Cannot send email.');
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: smtpPort,
        // SECURITY: Use secure connection for port 465, otherwise use STARTTLS
        secure: smtpPort === 465,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    // Define email options
    const mailOptions = {
        from: `${process.env.FROM_NAME || 'Marketplace'} <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
