import React from 'react';
import { Link } from 'react-router-dom';
import logger from '../../utils/logger';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="page-container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '80vh',
                        textAlign: 'center',
                    }}
                >
                    <div className="container">
                        <div
                            className="error-card"
                            style={{
                                padding: '3rem',
                                backgroundColor: 'white',
                                borderRadius: '1rem',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                            }}
                        >
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                            <h1 style={{ marginBottom: '1rem' }}>Oops! Something went wrong.</h1>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                We're sorry for the inconvenience. The application encountered an
                                unexpected error.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn btn-primary"
                                >
                                    Reload Page
                                </button>
                                <Link
                                    to="/"
                                    className="btn btn-outline"
                                    onClick={() => this.setState({ hasError: false })}
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
