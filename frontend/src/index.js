import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCLS, getFCP, getLCP, getTTFB } from 'web-vitals';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// ── Web Vitals / Real User Monitoring (RUM) ──────────────────────────────────
// Measures Core Web Vitals: CLS, FCP, FID (INP), LCP, TTFB
// In development: logs to console so engineers can spot regressions.
// In production:  sends metrics to your analytics endpoint or Sentry.
//
// To enable production reporting, set REACT_APP_API_URL in your environment.
// To use Sentry instead, replace the fetch call with:
//   import * as Sentry from '@sentry/react';
//   Sentry.captureMessage('web-vital', { extra: metric });


const reportWebVital = (metric) => {
    if (process.env.NODE_ENV === 'development') {
        // Friendly console output during local development
        console.info(`[Web Vitals] ${metric.name}:`, Math.round(metric.value), metric.rating);
        return;
    }

    // Production: send to your own analytics endpoint (set REACT_APP_ANALYTICS_URL
    // or fall back to API_URL + /api/metrics/vitals)
    const endpoint =
        process.env.REACT_APP_ANALYTICS_URL ||
        `${process.env.REACT_APP_API_URL || ''}/api/metrics/vitals`;

    // Use sendBeacon for reliability on page unload; fall back to fetch
    const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        url: window.location.href,
        userAgent: navigator.userAgent,
    });

    if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body);
    } else {
        fetch(endpoint, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
};

getCLS(reportWebVital);
getFCP(reportWebVital);
getLCP(reportWebVital);
getTTFB(reportWebVital);
// Note: getFID is deprecated in web-vitals v4+; INP is the modern replacement
// If using web-vitals >=4: import { getINP } from 'web-vitals'; getINP(reportWebVital);

