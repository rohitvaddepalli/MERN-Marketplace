import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Error.css';

const ServerError = () => {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="error-page">
            <Helmet>
                <title>500 - Server Error | Marketplace</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="error-container">
                <div className="error-content">
                    <div className="error-illustration">
                        <svg
                            width="200"
                            height="200"
                            viewBox="0 0 200 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                stroke="#ef4444"
                                strokeWidth="4"
                                opacity="0.2"
                            />
                            <path
                                d="M100 60L100 110"
                                stroke="#ef4444"
                                strokeWidth="6"
                                strokeLinecap="round"
                            />
                            <circle cx="100" cy="130" r="5" fill="#ef4444" />
                            <path
                                d="M60 160L140 160"
                                stroke="#ef4444"
                                strokeWidth="4"
                                strokeLinecap="round"
                                opacity="0.3"
                            />
                        </svg>
                    </div>

                    <h1 className="error-code">500</h1>
                    <h2 className="error-title">Server Error</h2>
                    <p className="error-description">
                        Something went wrong on our end. We're working to fix it. Please try again
                        in a moment.
                    </p>

                    <div className="error-actions">
                        <button onClick={handleRefresh} className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M17 10c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7c1.657 0 3.175.577 4.374 1.54L12 7h5V2l-1.894 1.894C13.46 2.488 11.798 1.5 10 1.5c-4.694 0-8.5 3.806-8.5 8.5s3.806 8.5 8.5 8.5 8.5-3.806 8.5-8.5h-1.5z"
                                    fill="currentColor"
                                />
                            </svg>
                            Refresh Page
                        </button>
                        <Link to="/" className="btn btn-outline">
                            Go Home
                        </Link>
                    </div>

                    <div className="error-suggestions">
                        <p className="suggestions-title">If the problem persists:</p>
                        <div className="suggestions-links">
                            <Link to="/help">Help Center</Link>
                            <Link to="/contact">Contact Support</Link>
                            <a
                                href="https://status.marketplace.com"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                System Status
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerError;
