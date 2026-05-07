import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '@env';

// Get base URL from environment or fallback to emulator localhost
const BASE_URL = API_BASE_URL || 'http://10.0.2.2:5000/api';
console.log('🚀 [Store API] Initializing with Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    // DEBUG: Log the full URL
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    const state = store.getState();
    const { token, activeStoreId } = state.auth;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeStoreId) {
      config.headers['x-store-id'] = activeStoreId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is due to expired token (e.g., 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again.',
      });
    }
    return Promise.reject(error);
  }
);

export const storeApi = {
  getMyStores: () => api.get('/store/me/stores'),
  getDashboard: (params) => api.get('/store/dashboard', { params }),
  getInventory: (params) => api.get('/store/inventory', { params }),
  updateStock: (productId, quantity) => api.patch(`/store/inventory/${productId}/stock`, { quantity }),
  updateProductStatus: (productId, is_active) => api.patch(`/store/inventory/${productId}/status`, { is_active }),
  createProduct: (productData) => api.post('/store/inventory', productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (productId, productData) => api.put(`/store/inventory/${productId}`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (productId) => api.delete(`/store/inventory/${productId}`),
  exportInventoryCSV: (params) => api.get('/store/inventory/export', { params }),
  getOrders: (params) => api.get('/store/orders', { params }),
  getCustomers: (params) => api.get('/store/customers', { params }),
  updateOrderStatus: (orderId, status) => api.patch(`/store/orders/${orderId}/status`, { status }),
  exportOrdersCSV: (params) => api.get('/store/orders/export', { params }),
  getStoreProfile: () => api.get('/store/profile'),
  updateStoreStatus: (is_active) => api.patch('/store/profile/status', { is_active }),
  updateFcmToken: (token) => api.patch('/store/fcm-token', { fcm_token: token }),
  getCategories: () => api.get('/store/categories'),
  getSubCategories: (categoryId) => api.get('/store/sub-categories', { params: { categoryId } }),
};

export default api;
