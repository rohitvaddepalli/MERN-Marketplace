import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import './Navbar.css';

const Navbar = () => {
    const { isSeller, isAdmin } = useAuth();
    const { getCartCount } = useCart();
    const { unreadCount, markAllRead } = useSocket();
    const location = useLocation();

    // Hide Navbar on seller and admin dashboard routes
    if (location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon">M</div>
                        <span className="logo-text">Marketplace</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="navbar-search">
                        <input
                            type="text"
                            placeholder="Search for products, stores..."
                            className="search-input"
                            aria-label="Search for products, stores"
                        />
                        <button className="search-btn" aria-label="Submit search">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="navbar-links">
                        {!isSeller && (
                            <>
                                <Link to="/products" className="nav-link">
                                    Products
                                </Link>
                                <Link to="/stores" className="nav-link">
                                    Stores
                                </Link>
                            </>
                        )}

                        <Show when="signed-in">
                            <>
                                {!isSeller && !isAdmin && (
                                    <>
                                        <Link
                                            to="/customer/orders"
                                            className="nav-link notification-link"
                                            onClick={markAllRead}
                                            aria-label="Notifications"
                                            style={{ position: 'relative' }}
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span
                                                    className="cart-badge"
                                                    style={{ right: '-5px', top: '-5px' }}
                                                >
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link to="/cart" className="nav-link cart-link">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M9 2L7.17 4M15 2l1.83 2M9 22v-6M15 22v-6M3 8h18M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l1.5-2m16.5 2l-1.5-2"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            Cart
                                            {getCartCount() > 0 && (
                                                <span className="cart-badge">{getCartCount()}</span>
                                            )}
                                        </Link>
                                    </>
                                )}

                                <div className="user-menu-wrapper">
                                    <UserButton />
                                </div>
                            </>
                        </Show>
                        <Show when="signed-out">
                            <>
                                <SignInButton mode="modal">
                                    <button className="btn btn-ghost">Login</button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button className="btn btn-primary">Sign Up</button>
                                </SignUpButton>
                            </>
                        </Show>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
