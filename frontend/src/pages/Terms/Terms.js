import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Terms.css';

const Terms = () => {
    return (
        <div className="terms-page">
            <Helmet>
                <title>Terms & Conditions | Marketplace</title>
                <meta
                    name="description"
                    content="Read Marketplace's Terms & Conditions covering user accounts, seller obligations, buyer obligations, payment policies, returns, and intellectual property."
                />
                <link rel="canonical" href="https://market-place01.web.app/terms" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Terms & Conditions | Marketplace" />
                <meta property="og:url" content="https://market-place01.web.app/terms" />
            </Helmet>
            <section className="terms-hero">
                <div className="container">
                    <h1>Terms & Conditions</h1>
                    <p>Last updated: December 1, 2025</p>
                </div>
            </section>

            <section className="terms-content">
                <div className="container">
                    <div className="terms-container">
                        <div className="terms-section">
                            <h2>1. Agreement to Terms</h2>
                            <p>
                                By accessing and using Marketplace, you accept and agree to be bound
                                by the terms and provision of this agreement. If you do not agree to
                                abide by the above, please do not use this service.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>2. Use License</h2>
                            <p>
                                Permission is granted to temporarily download one copy of the
                                materials on Marketplace's website for personal, non-commercial
                                transitory viewing only. This is the grant of a license, not a
                                transfer of title, and under this license you may not:
                            </p>
                            <ul>
                                <li>Modify or copy the materials</li>
                                <li>
                                    Use the materials for any commercial purpose or for any public
                                    display
                                </li>
                                <li>
                                    Attempt to reverse engineer any software contained on
                                    Marketplace's website
                                </li>
                                <li>
                                    Remove any copyright or other proprietary notations from the
                                    materials
                                </li>
                                <li>
                                    Transfer the materials to another person or "mirror" the
                                    materials on any other server
                                </li>
                            </ul>
                        </div>

                        <div className="terms-section">
                            <h2>3. User Accounts</h2>
                            <p>
                                When you create an account with us, you must provide information
                                that is accurate, complete, and current at all times. Failure to do
                                so constitutes a breach of the Terms, which may result in immediate
                                termination of your account on our Service.
                            </p>
                            <p>
                                You are responsible for safeguarding the password that you use to
                                access the Service and for any activities or actions under your
                                password.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>4. Seller Obligations</h2>
                            <p>If you are a seller on our platform, you agree to:</p>
                            <ul>
                                <li>Provide accurate product descriptions and images</li>
                                <li>Honor all sales and deliver products as described</li>
                                <li>Respond to customer inquiries in a timely manner</li>
                                <li>Comply with all applicable laws and regulations</li>
                                <li>Pay all applicable fees and commissions</li>
                                <li>Not engage in fraudulent or deceptive practices</li>
                            </ul>
                        </div>

                        <div className="terms-section">
                            <h2>5. Buyer Obligations</h2>
                            <p>If you are a buyer on our platform, you agree to:</p>
                            <ul>
                                <li>Provide accurate shipping and payment information</li>
                                <li>Pay for all purchases made through your account</li>
                                <li>Not engage in fraudulent chargebacks or payment disputes</li>
                                <li>Leave honest and fair reviews</li>
                                <li>Comply with our return and refund policies</li>
                            </ul>
                        </div>

                        <div className="terms-section">
                            <h2>6. Prohibited Activities</h2>
                            <p>
                                You may not access or use the Site for any purpose other than that
                                for which we make the Site available. The Site may not be used in
                                connection with any commercial endeavors except those that are
                                specifically endorsed or approved by us.
                            </p>
                            <p>As a user of the Site, you agree not to:</p>
                            <ul>
                                <li>
                                    Systematically retrieve data or other content from the Site to
                                    create a collection
                                </li>
                                <li>Make any unauthorized use of the Site</li>
                                <li>
                                    Circumvent, disable, or otherwise interfere with
                                    security-related features
                                </li>
                                <li>Engage in unauthorized framing of or linking to the Site</li>
                                <li>Trick, defraud, or mislead us and other users</li>
                                <li>
                                    Interfere with, disrupt, or create an undue burden on the Site
                                </li>
                                <li>
                                    Harass, annoy, intimidate, or threaten any of our employees or
                                    agents
                                </li>
                                <li>Sell or transfer your profile</li>
                            </ul>
                        </div>

                        <div className="terms-section">
                            <h2>7. Payment and Fees</h2>
                            <p>
                                All prices are listed in the currency specified on the product page.
                                Sellers are responsible for setting their own prices. Marketplace
                                charges a commission on each sale as outlined in our Seller
                                Agreement.
                            </p>
                            <p>
                                Payment processing is handled by third-party payment processors. By
                                making a purchase, you agree to their terms and conditions.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>8. Returns and Refunds</h2>
                            <p>
                                Our return policy allows customers to return most items within 30
                                days of delivery. Items must be unused and in original packaging.
                                Refunds are processed within 5-7 business days after we receive the
                                returned item.
                            </p>
                            <p>
                                Some items may not be eligible for returns. Please check the product
                                page for specific return policies.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>9. Intellectual Property</h2>
                            <p>
                                The Site and its entire contents, features, and functionality are
                                owned by Marketplace and are protected by copyright, trademark, and
                                other intellectual property laws.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>10. Limitation of Liability</h2>
                            <p>
                                In no event shall Marketplace, nor its directors, employees,
                                partners, agents, suppliers, or affiliates, be liable for any
                                indirect, incidental, special, consequential or punitive damages,
                                including without limitation, loss of profits, data, use, goodwill,
                                or other intangible losses.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>11. Termination</h2>
                            <p>
                                We may terminate or suspend your account immediately, without prior
                                notice or liability, for any reason whatsoever, including without
                                limitation if you breach the Terms.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>12. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify or replace these Terms at any time.
                                If a revision is material, we will try to provide at least 30 days'
                                notice prior to any new terms taking effect.
                            </p>
                        </div>

                        <div className="terms-section">
                            <h2>13. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <p>
                                Email: legal@marketplace.com
                                <br />
                                Phone: +1 (555) 123-4567
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

export default Terms;
