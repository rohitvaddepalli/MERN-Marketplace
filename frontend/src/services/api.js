import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/updateprofile', data),
    forgotPassword: (data) => api.post('/auth/forgotpassword', data)
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
    getFeaturedProducts: () => api.get('/products/featured')
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

export default api;

