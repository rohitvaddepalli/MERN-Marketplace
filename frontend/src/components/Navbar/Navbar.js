import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout, isSeller, isAdmin } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Hide Navbar on seller and admin dashboard routes
    if (location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin')) {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                        />
                        <button className="search-btn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

                        {isAuthenticated ? (
                            <>
                                {!isSeller && !isAdmin && (
                                    <Link to="/cart" className="nav-link cart-link">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 2L7.17 4M15 2l1.83 2M9 22v-6M15 22v-6M3 8h18M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l1.5-2m16.5 2l-1.5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Cart
                                        {getCartCount() > 0 && (
                                            <span className="cart-badge">{getCartCount()}</span>
                                        )}
                                    </Link>
                                )}

                                <div className="user-menu-wrapper">
                                    <button
                                        className="user-menu-btn"
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                    >
                                        <img
                                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                            alt={user?.name}
                                            className="user-avatar"
                                        />
                                        <span>{user?.name}</span>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>

                                    {showUserMenu && (
                                        <div className="user-dropdown">
                                            <Link
                                                to={isSeller ? "/seller/dashboard" : isAdmin ? "/admin/dashboard" : "/customer/dashboard"}
                                                className="dropdown-item"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                    <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                                Dashboard
                                            </Link>
                                            {!isSeller && !isAdmin && (
                                                <Link
                                                    to="/customer/orders"
                                                    className="dropdown-item"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                        <path d="M3 1v18M3 4h14a2 2 0 012 2v10a2 2 0 01-2 2H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                    My Orders
                                                </Link>
                                            )}
                                            <button className="dropdown-item" onClick={handleLogout}>
                                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                    <path d="M13 3h3a2 2 0 012 2v10a2 2 0 01-2 2h-3M8 16l-5-5m0 0l5-5m-5 5h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
