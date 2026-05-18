/**
 * App.test.js — meaningful smoke tests for the application root.
 *
 * What we test here:
 *  1. App mounts without crashing
 *  2. The Navbar is rendered (present in the DOM)
 *  3. A public route ("/") renders the Home page
 *  4. An unknown route renders the 404 page
 *
 * Heavy context dependencies (AuthProvider, CartProvider, SocketProvider,
 * Firebase) are mocked so tests stay fast and deterministic.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

// ── Tests ─────────────────────────────────────────────────────────────────────

// Import the real App after mocks are registered
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        // If render throws, the test fails automatically
    });

    it('renders the Navbar', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('renders the Home page at "/"', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('renders the 404 page for unknown routes', () => {
        render(
            <MemoryRouter initialEntries={['/this-route-does-not-exist']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
});
