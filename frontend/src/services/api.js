import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';

const API_URL = isProduction
    ? process.env.REACT_APP_API_URL
        ? `${process.env.REACT_APP_API_URL}/api`
        : '/api'
    : process.env.REACT_APP_API_URL
      ? `${process.env.REACT_APP_API_URL}/api`
      : 'http://localhost:5000/api';

// Create axios instance with credentials support for HTTP-only cookies
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Clerk session token provider — AuthContext registers a getter that resolves
// `useAuth().getToken()`, so every request carries a short-lived Bearer token.
let authTokenGetter = null;
export const setAuthTokenGetter = (getter) => {
    authTokenGetter = getter;
};

api.interceptors.request.use(
    async (config) => {
        if (authTokenGetter) {
            try {
                const token = await authTokenGetter();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (_e) {
                // No active session — request goes out unauthenticated
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if this is just an auth check — the AuthContext
            // handles signed-out state on its own.
            if (error.config?.url?.includes('/auth/me')) {
                return Promise.reject(error);
            }
            // Session expired — send the user to the Clerk-backed login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    // Register/login/password-reset live in Clerk now; only the local
    // profile endpoints remain on the backend.
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/updateprofile', data),
    logout: () => api.post('/auth/logout'),
};

// Store API
export const storeAPI = {
    getStores: (params) => api.get('/stores', { params }),
    getStore: (id) => api.get(`/stores/${id}`),
    createStore: (data) => api.post('/stores', data),
    updateStore: (id, data) => api.put(`/stores/${id}`, data),
    deleteStore: (id) => api.delete(`/stores/${id}`),
    getMyStore: () => api.get('/stores/my/store'),
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
    getReviews: (id) => api.get(`/products/${id}/reviews`),
    markReviewHelpful: (productId, reviewId) =>
        api.put(`/products/${productId}/reviews/${reviewId}/helpful`),
};

// User API
export const userAPI = {
    getWishlist: () => api.get('/users/wishlist'),
    addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
    removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
    getRecentlyViewed: () => api.get('/users/recently-viewed'),
    addToRecentlyViewed: (productId) => api.post(`/users/recently-viewed/${productId}`),
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
    getAdminProductAnalytics: () => api.get('/analytics/admin/products'),
};

// Order API
export const orderAPI = {
    createOrder: (data) => api.post('/orders', data),
    getMyOrders: () => api.get('/orders/myorders'),
    getOrder: (id) => api.get(`/orders/${id}`),
    updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
    getSellerOrders: () => api.get('/orders/seller/orders'),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
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
    verifyStore: (id, data) => api.put(`/admin/stores/${id}/verify`, data),
    deleteStore: (id) => api.delete(`/admin/stores/${id}`),

    // Product management
    getAllProducts: (params) => api.get('/admin/products', { params }),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`),

    // Order management
    getAllOrders: (params) => api.get('/admin/orders', { params }),
    deleteOrder: (id) => api.delete(`/admin/orders/${id}`),

    // Settings management
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),
};

// Public Settings API
export const settingsAPI = {
    getSettings: () => api.get('/settings'),
};

// Chat API
export const chatAPI = {
    getMessages: (roomId) => api.get(`/chat/${roomId}`),
};

// Upload API — Cloudflare R2
export const uploadAPI = {
    uploadImages: (formData) =>
        api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    getUploadSignature: (type) => api.get('/upload/signature', { params: { type } }),
    // Direct browser → R2 upload via a presigned PUT URL (keeps large files
    // off the API server, same idea as the old Cloudinary direct upload).
    uploadDirect: async (file) => {
        const contentType = file.type || 'application/octet-stream';
        const sigRes = await api.get('/upload/signature', {
            params: { type: contentType },
        });
        const { uploadUrl, key, publicUrl } = sigRes.data;

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file,
        });
        if (!uploadRes.ok) {
            throw new Error(`R2 upload failed (${uploadRes.status})`);
        }
        return {
            url: publicUrl,
            publicId: key,
        };
    },
};

export { API_URL };
export const BASE_API_URL = isProduction
    ? process.env.REACT_APP_API_URL || window.location.origin
    : process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default api;
