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
import Products from './pages/Products/Products';
import ProductDetail from './pages/Products/ProductDetail';
import Stores from './pages/Stores/Stores';
import StoreDetail from './pages/Stores/StoreDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';

// Customer Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import CustomerOrders from './pages/Customer/Orders';
import CustomerSettings from './pages/Customer/Settings';

// Seller Pages
import SellerDashboard from './pages/Seller/Dashboard';
import StoreManagement from './pages/Seller/StoreManagement';
import ProductManagement from './pages/Seller/ProductManagement';
import OrderManagement from './pages/Seller/OrderManagement';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserManagement from './pages/Admin/UserManagement';
import AdminStoreManagement from './pages/Admin/StoreManagement';
import AdminProductManagement from './pages/Admin/ProductManagement';
import AdminOrderManagement from './pages/Admin/OrderManagement';
import AdminSettings from './pages/Admin/Settings';

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
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:id" element={<StoreDetail />} />

              {/* Customer Routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute requireRole="customer">
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute requireRole="customer">
                    <Checkout />
                  </ProtectedRoute>
                }
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
