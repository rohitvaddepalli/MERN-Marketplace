import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
    return (
        <div className="about-page">
            <section className="about-hero">
                <div className="container">
                    <h1>About Marketplace</h1>
                    <p>Connecting local sellers with customers worldwide</p>
                </div>
            </section>

            <section className="about-content">
                <div className="container">
                    <div className="about-section">
                        <h2>Our Story</h2>
                        <p>
                            Marketplace was founded with a simple mission: to empower local sellers and provide customers
                            with access to unique, quality products from verified sellers around the world. We believe in
                            supporting small businesses and creating opportunities for entrepreneurs to grow their ventures.
                        </p>
                        <p>
                            Since our inception, we've helped thousands of sellers reach new customers and enabled millions
                            of shoppers to discover amazing products they wouldn't find anywhere else.
                        </p>
                    </div>

                    <div className="about-section">
                        <h2>Our Mission</h2>
                        <p>
                            To create a thriving marketplace ecosystem where local sellers can flourish and customers can
                            discover unique products with confidence. We're committed to providing a secure, user-friendly
                            platform that benefits both buyers and sellers.
                        </p>
                    </div>

                    <div className="about-values">
                        <h2>Our Values</h2>
                        <div className="values-grid">
                            <div className="value-card">
                                <div className="value-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h3>Trust & Security</h3>
                                <p>We verify all sellers and ensure secure transactions for peace of mind.</p>
                            </div>

                            <div className="value-card">
                                <div className="value-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <h3>Community First</h3>
                                <p>Supporting local businesses and building lasting relationships.</p>
                            </div>

                            <div className="value-card">
                                <div className="value-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5" />
                                        <path d="M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <h3>Quality Products</h3>
                                <p>Curated selection of high-quality products from trusted sellers.</p>
                            </div>

                            <div className="value-card">
                                <div className="value-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <h3>Innovation</h3>
                                <p>Constantly improving our platform to serve you better.</p>
                            </div>
                        </div>
                    </div>

                    <div className="about-cta">
                        <h2>Join Our Community</h2>
                        <p>Whether you're a seller looking to grow your business or a customer seeking unique products, we're here for you.</p>
                        <div className="cta-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">Become a Seller</Link>
                            <Link to="/products" className="btn btn-outline btn-lg">Start Shopping</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
