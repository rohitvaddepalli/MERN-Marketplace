import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar/Navbar';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import LoginSuccess from './pages/Auth/LoginSuccess';
import Products from './pages/Products/Products';
import ProductDetail from './pages/Products/ProductDetail';
import Stores from './pages/Stores/Stores';
import StoreDetail from './pages/Stores/StoreDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import OrderSuccess from './pages/OrderSuccess/OrderSuccess';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Help from './pages/Help/Help';
import Terms from './pages/Terms/Terms';

// Customer Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import CustomerOrders from './pages/Customer/Orders';
import CustomerSettings from './pages/Customer/Settings';
import Wishlist from './pages/Customer/Wishlist';

// Seller Pages
import SellerDashboard from './pages/Seller/Dashboard';
import StoreManagement from './pages/Seller/StoreManagement';
import ProductManagement from './pages/Seller/ProductManagement';
import OrderManagement from './pages/Seller/OrderManagement';
import InventoryManagement from './pages/Seller/InventoryManagement';
import Analytics from './pages/Seller/Analytics';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserManagement from './pages/Admin/UserManagement';
import AdminStoreManagement from './pages/Admin/StoreManagement';
import AdminProductManagement from './pages/Admin/ProductManagement';
import AdminOrderManagement from './pages/Admin/OrderManagement';
import AdminSettings from './pages/Admin/Settings';
import AdminAnalytics from './pages/Admin/Analytics';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/success" element={<LoginSuccess />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:id" element={<StoreDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/terms" element={<Terms />} />

              {/* Customer Routes */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
