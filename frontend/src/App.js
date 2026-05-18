import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

// Components
import Navbar from './components/Navbar/Navbar';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Pages
import Home from './pages/Home/Home';

// Lazy load other pages
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/Auth/ResetPassword'));
const LoginSuccess = React.lazy(() => import('./pages/Auth/LoginSuccess'));

const Products = React.lazy(() => import('./pages/Products/Products'));
const ProductDetail = React.lazy(() => import('./pages/Products/ProductDetail'));
const Stores = React.lazy(() => import('./pages/Stores/Stores'));
const StoreDetail = React.lazy(() => import('./pages/Stores/StoreDetail'));
const Cart = React.lazy(() => import('./pages/Cart/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout/Checkout'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess/OrderSuccess'));
const About = React.lazy(() => import('./pages/About/About'));
const Contact = React.lazy(() => import('./pages/Contact/Contact'));
const Help = React.lazy(() => import('./pages/Help/Help'));
const Terms = React.lazy(() => import('./pages/Terms/Terms'));

// Customer Pages
const CustomerDashboard = React.lazy(() => import('./pages/Customer/Dashboard'));
const CustomerOrders = React.lazy(() => import('./pages/Customer/Orders'));
const CustomerSettings = React.lazy(() => import('./pages/Customer/Settings'));
const Wishlist = React.lazy(() => import('./pages/Customer/Wishlist'));

// Seller Pages
const SellerDashboard = React.lazy(() => import('./pages/Seller/Dashboard'));
const StoreManagement = React.lazy(() => import('./pages/Seller/StoreManagement'));
const ProductManagement = React.lazy(() => import('./pages/Seller/ProductManagement'));
const OrderManagement = React.lazy(() => import('./pages/Seller/OrderManagement'));
const InventoryManagement = React.lazy(() => import('./pages/Seller/InventoryManagement'));
const Analytics = React.lazy(() => import('./pages/Seller/Analytics'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUserManagement = React.lazy(() => import('./pages/Admin/UserManagement'));
const AdminStoreManagement = React.lazy(() => import('./pages/Admin/StoreManagement'));
const AdminProductManagement = React.lazy(() => import('./pages/Admin/ProductManagement'));
const AdminOrderManagement = React.lazy(() => import('./pages/Admin/OrderManagement'));
const AdminSettings = React.lazy(() => import('./pages/Admin/Settings'));
const AdminAnalytics = React.lazy(() => import('./pages/Admin/Analytics'));

// Error Pages
const NotFound = React.lazy(() => import('./pages/Error/NotFound'));

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Show loading while auth is initializing
    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // If a specific role is required, wait for user data to be fully loaded
    // This prevents redirecting sellers/admins before their role is fetched from Firestore
    if (requireRole && !user?.role) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
            </div>
        );
    }

    // Check if user has the required role
    if (requireRole && user?.role !== requireRole) {
        // Redirect based on actual role
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (user.role === 'seller') {
            return <Navigate to="/seller/dashboard" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <HelmetProvider>
                <Router>
                    <AuthProvider>
                        <SocketProvider>
                            <CartProvider>
                                <div className="App">
                                    <Navbar />
                                    <Toaster position="top-right" />
                                    <React.Suspense
                                        fallback={
                                            <div className="loading-page">
                                                <div className="spinner"></div>
                                            </div>
                                        }
                                    >
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/" element={<Home />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route
                                                path="/login/success"
                                                element={<LoginSuccess />}
                                            />
                                            <Route path="/register" element={<Register />} />
                                            <Route
                                                path="/forgot-password"
                                                element={<ForgotPassword />}
                                            />
                                            <Route
                                                path="/reset-password/:token"
                                                element={<ResetPassword />}
                                            />
                                            <Route path="/products" element={<Products />} />
                                            <Route
                                                path="/products/:id"
                                                element={<ProductDetail />}
                                            />
                                            <Route path="/stores" element={<Stores />} />
                                            <Route path="/stores/:id" element={<StoreDetail />} />
                                            <Route path="/about" element={<About />} />
                                            <Route path="/contact" element={<Contact />} />
                                            <Route path="/help" element={<Help />} />
                                            <Route path="/terms" element={<Terms />} />

                                            {/* Customer Routes */}
                                            <Route path="/cart" element={<Cart />} />
                                            <Route path="/checkout" element={<Checkout />} />
                                            <Route
                                                path="/order-success"
                                                element={<OrderSuccess />}
                                            />
                                            <Route
                                                path="/customer/dashboard"
                                                element={
                                                    <ProtectedRoute requireRole="customer">
                                                        <CustomerDashboard />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/customer/orders"
                                                element={
                                                    <ProtectedRoute requireRole="customer">
                                                        <CustomerOrders />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/customer/settings"
                                                element={
                                                    <ProtectedRoute requireRole="customer">
                                                        <CustomerSettings />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/wishlist"
                                                element={
                                                    <ProtectedRoute requireRole="customer">
                                                        <Wishlist />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Seller Routes */}
                                            <Route
                                                path="/seller/dashboard"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <SellerDashboard />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/seller/store"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <StoreManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/seller/products"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <ProductManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/seller/orders"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <OrderManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/seller/inventory"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <InventoryManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/seller/analytics"
                                                element={
                                                    <ProtectedRoute requireRole="seller">
                                                        <Analytics />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Admin Routes */}
                                            <Route
                                                path="/admin/dashboard"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminDashboard />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/users"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminUserManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/stores"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminStoreManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/products"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminProductManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/orders"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminOrderManagement />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/settings"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminSettings />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/admin/analytics"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <AdminAnalytics />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Safe admin entry alias — obscures the real route in public-facing docs */}
                                            <Route
                                                path="/portal-admin"
                                                element={
                                                    <ProtectedRoute requireRole="admin">
                                                        <Navigate to="/admin/dashboard" replace />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Fallback - 404 Not Found */}
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </React.Suspense>
                                </div>
                            </CartProvider>
                        </SocketProvider>
                    </AuthProvider>
                </Router>
            </HelmetProvider>
        </ErrorBoundary>
    );
}

export default App;
