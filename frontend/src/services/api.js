import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:5000/api';

// Create axios instance with credentials support for HTTP-only cookies
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    // SECURITY: Include credentials (cookies) with every request
    // This allows HTTP-only cookies to be sent automatically
    withCredentials: true
});

// SECURITY: Request interceptor removed - authentication via HTTP-only cookies only
// Cookies are sent automatically with withCredentials: true
// No manual Authorization header needed

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if this is just an auth check
            if (error.config?.url?.includes('/auth/me')) {
                return Promise.reject(error);
            }

            // Clear any legacy localStorage data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login (cookies are cleared server-side)
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'), // NEW: Server-side logout clears HTTP-only cookie
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/updateprofile', data),
    forgotPassword: (data) => api.post('/auth/forgotpassword', data),
};

// Store API
export const storeAPI = {
    getStores: (params) => api.get('/stores', { params }),
    getStore: (id) => api.get(`/stores/${id}`),
    createStore: (data) => api.post('/stores', data),
    updateStore: (id, data) => api.put(`/stores/${id}`, data),
    deleteStore: (id) => api.delete(`/stores/${id}`),
    getMyStore: () => api.get('/stores/my/store')
};

// Product API
export const productAPI = {
    getProducts: (params) => api.get('/products', { params }),
    getProduct: (id) => api.get(`/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    getMyProducts: () => api.get('/products/my/products'),
    getFeaturedProducts: () => api.get('/products/featured'),
    getLowStockProducts: () => api.get('/products/low-stock'),
    bulkImportProducts: (data) => api.post('/products/bulk-import', data),
    exportProducts: () => api.get('/products/export'),
    // Reviews
    createReview: (id, data) => api.post(`/products/${id}/reviews`, data),
    getReviews: (id) => api.get(`/products/${id}/reviews`)
};

// User API
export const userAPI = {
    getWishlist: () => api.get('/users/wishlist'),
    addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
    removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
    getRecentlyViewed: () => api.get('/users/recently-viewed'),
    addToRecentlyViewed: (productId) => api.post(`/users/recently-viewed/${productId}`)
};

// Analytics API
export const analyticsAPI = {
    getSalesAnalytics: (params) => api.get('/analytics/sales', { params }),
    getCustomerAnalytics: () => api.get('/analytics/customers'),
    getInventoryForecast: (params) => api.get('/analytics/inventory-forecast', { params }),
    getProductAnalytics: () => api.get('/analytics/products'),
    // Admin Analytics
    getAdminSalesAnalytics: (params) => api.get('/analytics/admin/sales', { params }),
    getAdminCustomerAnalytics: () => api.get('/analytics/admin/customers'),
    getAdminProductAnalytics: () => api.get('/analytics/admin/products')
};

// Order API
export const orderAPI = {
    createOrder: (data) => api.post('/orders', data),
    getMyOrders: () => api.get('/orders/myorders'),
    getOrder: (id) => api.get(`/orders/${id}`),
    updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
    getSellerOrders: () => api.get('/orders/seller/orders')
};

// Admin API
export const adminAPI = {
    // Dashboard
    getDashboardStats: () => api.get('/admin/stats'),

    // User management
    getAllUsers: (params) => api.get('/admin/users', { params }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),

    // Store management
    getAllStores: (params) => api.get('/admin/stores', { params }),
    updateStoreStatus: (id, data) => api.put(`/admin/stores/${id}/status`, data),
    deleteStore: (id) => api.delete(`/admin/stores/${id}`),

    // Product management
    getAllProducts: (params) => api.get('/admin/products', { params }),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`),

    // Order management
    getAllOrders: (params) => api.get('/admin/orders', { params }),
    deleteOrder: (id) => api.delete(`/admin/orders/${id}`),

    // Settings management
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data)
};

// Public Settings API
export const settingsAPI = {
    getSettings: () => api.get('/settings')
};

// Upload API
export const uploadAPI = {
    uploadImages: (formData) => api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
};

export { API_URL };
export const BASE_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default api;
