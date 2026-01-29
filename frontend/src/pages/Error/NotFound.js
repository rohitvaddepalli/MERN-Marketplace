import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Error.css';

const NotFound = () => {
    return (
        <div className="error-page">
            <Helmet>
                <title>404 - Page Not Found | Marketplace</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="error-container">
                <div className="error-content">
                    <div className="error-illustration">
                        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="100" cy="100" r="80" stroke="var(--primary-color)" strokeWidth="4" opacity="0.2" />
                            <path d="M70 85C70 80.5817 73.5817 77 78 77H92C96.4183 77 100 80.5817 100 85V95C100 99.4183 96.4183 103 92 103H78C73.5817 103 70 99.4183 70 95V85Z" fill="var(--primary-color)" opacity="0.3" />
                            <path d="M100 85C100 80.5817 103.582 77 108 77H122C126.418 77 130 80.5817 130 85V95C130 99.4183 126.418 103 122 103H108C103.582 103 100 99.4183 100 95V85Z" fill="var(--primary-color)" opacity="0.3" />
                            <path d="M70 120C70 115 85 110 100 110C115 110 130 115 130 120V125C130 129.418 126.418 133 122 133H78C73.5817 133 70 129.418 70 125V120Z" fill="var(--primary-color)" />
                        </svg>
                    </div>

                    <h1 className="error-code">404</h1>
                    <h2 className="error-title">Page Not Found</h2>
                    <p className="error-description">
                        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
                    </p>

                    <div className="error-actions">
                        <Link to="/" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 3L3 9h2v7h4v-5h2v5h4V9h2l-7-6z" fill="currentColor" />
                            </svg>
                            Go Home
                        </Link>
                        <Link to="/products" className="btn btn-outline">
                            Browse Products
                        </Link>
                    </div>

                    <div className="error-suggestions">
                        <p className="suggestions-title">You might be interested in:</p>
                        <div className="suggestions-links">
                            <Link to="/products">Products</Link>
                            <Link to="/stores">Stores</Link>
                            <Link to="/help">Help Center</Link>
                            <Link to="/contact">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
