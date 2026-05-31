import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Privacy.css';

const Privacy = () => {
    return (
        <div className="privacy-page">
            <Helmet>
                <title>Privacy Policy | Marketplace</title>
                <meta
                    name="description"
                    content="Read Marketplace's Privacy Policy to understand how we collect, use, and protect your personal data in compliance with GDPR, CCPA, and global privacy regulations."
                />
                <link rel="canonical" href="https://market-place01.web.app/privacy" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Privacy Policy | Marketplace" />
                <meta property="og:url" content="https://market-place01.web.app/privacy" />
            </Helmet>

            <section className="privacy-hero">
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p>Last updated: December 1, 2025</p>
                </div>
            </section>

            <section className="privacy-content">
                <div className="container">
                    <div className="privacy-container">

                        <div className="privacy-section">
                            <h2>1. Introduction</h2>
                            <p>
                                Welcome to Marketplace ("we," "our," or "us"). We are committed to
                                protecting your personal information and your right to privacy. This
                                Privacy Policy explains how we collect, use, disclose, and safeguard
                                your information when you visit our website at{' '}
                                <strong>market-place01.web.app</strong> or use our services.
                            </p>
                            <p>
                                Please read this policy carefully. If you disagree with its terms,
                                please discontinue use of the platform.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>2. Information We Collect</h2>
                            <p>We collect information that you provide directly to us, including:</p>
                            <ul>
                                <li>
                                    <strong>Account Information:</strong> Name, email address, password,
                                    and profile details when you create an account.
                                </li>
                                <li>
                                    <strong>Transaction Information:</strong> Purchase history, payment
                                    method details (processed securely by third-party processors), and
                                    shipping addresses.
                                </li>
                                <li>
                                    <strong>Seller Information:</strong> Business name, store description,
                                    product listings, and payout details if you register as a seller.
                                </li>
                                <li>
                                    <strong>Communications:</strong> Messages exchanged via our platform's
                                    chat system, support tickets, or contact forms.
                                </li>
                            </ul>
                            <p>
                                We also automatically collect certain technical data when you use our
                                platform:
                            </p>
                            <ul>
                                <li>Device type, browser, and operating system</li>
                                <li>IP address and general location</li>
                                <li>Pages visited, time spent, and referral URLs</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>3. How We Use Your Information</h2>
                            <p>We use the information we collect to:</p>
                            <ul>
                                <li>Provide, operate, and maintain our marketplace platform</li>
                                <li>Process transactions and send related notices</li>
                                <li>Manage your account and communicate with you</li>
                                <li>Enable buyer–seller messaging</li>
                                <li>Detect, prevent, and address fraud or security issues</li>
                                <li>Improve our platform through analytics</li>
                                <li>
                                    Send promotional communications (you may opt out at any time)
                                </li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>4. Sharing Your Information</h2>
                            <p>
                                We do not sell, rent, or trade your personal data. We may share it
                                only in the following circumstances:
                            </p>
                            <ul>
                                <li>
                                    <strong>Service Providers:</strong> Third-party vendors that help us
                                    operate our platform (payment processors, hosting services, analytics)
                                    under strict confidentiality agreements.
                                </li>
                                <li>
                                    <strong>Sellers:</strong> When you purchase from a seller, we share
                                    necessary order details (name, shipping address) with that seller to
                                    fulfil your order.
                                </li>
                                <li>
                                    <strong>Legal Requirements:</strong> When required by law, court order,
                                    or government authority.
                                </li>
                                <li>
                                    <strong>Business Transfers:</strong> In the event of a merger,
                                    acquisition, or asset sale, your data may be transferred to the
                                    successor entity.
                                </li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>5. Cookies & Tracking Technologies</h2>
                            <p>
                                We use cookies and similar technologies to enhance your browsing
                                experience, analyse site traffic, and personalise content. You can
                                control cookie preferences through your browser settings. Note that
                                disabling certain cookies may limit platform functionality.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>6. Data Retention</h2>
                            <p>
                                We retain your personal data for as long as your account is active or
                                as needed to provide our services. You may request deletion of your
                                account and associated data at any time by contacting us at{' '}
                                <strong>privacy@marketplace.com</strong>.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>7. Your Rights</h2>
                            <p>
                                Depending on your location, you may have the following rights regarding
                                your personal data:
                            </p>
                            <ul>
                                <li>
                                    <strong>Access:</strong> Request a copy of the personal data we hold
                                    about you.
                                </li>
                                <li>
                                    <strong>Rectification:</strong> Request correction of inaccurate data.
                                </li>
                                <li>
                                    <strong>Erasure:</strong> Request deletion of your personal data
                                    ("right to be forgotten").
                                </li>
                                <li>
                                    <strong>Portability:</strong> Request a machine-readable export of
                                    your data.
                                </li>
                                <li>
                                    <strong>Objection:</strong> Object to certain processing activities.
                                </li>
                                <li>
                                    <strong>Withdraw Consent:</strong> Withdraw consent for
                                    consent-based processing at any time.
                                </li>
                            </ul>
                            <p>
                                To exercise any of these rights, contact us at{' '}
                                <strong>privacy@marketplace.com</strong>. We will respond within 30
                                days.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>8. Security</h2>
                            <p>
                                We implement industry-standard security measures including SSL/TLS
                                encryption, secure data storage, and access controls to protect your
                                personal information. However, no method of transmission over the
                                internet is 100% secure.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>9. Children's Privacy</h2>
                            <p>
                                Our platform is not directed to individuals under the age of 16. We do
                                not knowingly collect personal data from children. If you believe a
                                child has provided us with their information, contact us immediately.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>10. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you
                                of significant changes by updating the "Last updated" date above and,
                                where appropriate, by sending you an email notification.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>11. Contact Us</h2>
                            <p>
                                If you have any questions, concerns, or requests regarding this Privacy
                                Policy or our data practices, please contact us at:
                            </p>
                            <p>
                                Email: <strong>privacy@marketplace.com</strong>
                                <br />
                                Phone: +91 98765 43210
                                <br />
                                Address: 123 Marketplace Street, Business District, City 12345
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default Privacy;
