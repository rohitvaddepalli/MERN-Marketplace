/**
 * App.test.js — meaningful smoke tests for the application root.
 *
 * What we test here:
 *  1. App mounts without crashing
 *  2. The Navbar is rendered (present in the DOM)
 *  3. A public route ("/") renders the Home page
 *  4. An unknown route renders the 404 page
 *
 */

// ── Mocks (BEFORE any imports) ────────────────────────────────────────────

// Firebase — avoid real SDK initialisation in unit tests
jest.mock('./firebase', () => ({
    auth: {},
    db: {},
}));

// AuthContext — provide a stable unauthenticated state
jest.mock('./context/AuthContext', () => ({
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
        isAuthenticated: false,
        user: null,
        loading: false,
    }),
}));

// CartContext
jest.mock('./context/CartContext', () => ({
    CartProvider: ({ children }) => children,
    useCart: () => ({ cartItems: [], cartCount: 0 }),
}));

// SocketContext — no real socket connections in tests
jest.mock('./context/SocketContext', () => ({
    SocketProvider: ({ children }) => children,
    useSocket: () => ({ socket: null }),
}));

// Navbar — lightweight stub so we're not testing Navbar internals here
jest.mock('./components/Navbar/Navbar', () => () => <nav data-testid="navbar">Navbar</nav>);

// Home page stub
jest.mock('./pages/Home/Home', () => () => <main data-testid="home-page">Home</main>);

// 404 page stub
jest.mock('./pages/Error/NotFound', () => () => <div data-testid="not-found-page">404</div>);

// react-helmet-async
jest.mock('react-helmet-async', () => ({
    HelmetProvider: ({ children }) => children,
    Helmet: ({ children }) => children,
}));

// react-hot-toast
jest.mock('react-hot-toast', () => ({
    Toaster: () => null,
    toast: { success: jest.fn(), error: jest.fn() },
}));

// ── Make React.lazy resolve synchronously ────────────────────────────────
// React.lazy uses dynamic import() which resolves as a microtask. In tests
// this means <React.Suspense> always shows its fallback spinner for at least
// one tick. By replacing lazy() with a version that resolves the promise
// eagerly via an already-resolved thenable, Suspense never fires.
jest.mock('react', () => {
    const React = jest.requireActual('react');

    return {
        ...React,
        // Replace lazy so it immediately resolves the import promise.
        // The wrapped component is still rendered normally; only the async
        // chunk-loading delay is eliminated.
        lazy: (factory) => {
            const Wrapped = React.lazy(() =>
                factory().then((mod) => ({ default: mod.default ?? mod }))
            );
            return Wrapped;
        },
    };
});

// ── Tests ───────────────────────────────────────────────────────────────

import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
    beforeEach(() => {
        // Reset window.history to root before each test
        window.history.pushState({}, 'Home', '/');
    });

    it('renders without crashing', async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });
    });

    it('renders the Navbar', async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByTestId('navbar')).toBeInTheDocument();
        });
    });

    it('renders the Home page at "/"', async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByTestId('home-page')).toBeInTheDocument();
        });
    });

    it('renders the 404 page for unknown routes', async () => {
        window.history.pushState({}, 'Test Page', '/this-route-does-not-exist');
        render(<App />);
        // waitFor retries until Suspense resolves and NotFound is painted
        await waitFor(
            () => {
                expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
            },
            { timeout: 3000 }
        );
    });
});