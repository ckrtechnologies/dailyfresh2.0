import axios from 'axios';
import { ENV } from '../config/env';
import { showGlobalAlert } from '../services/alertService';
import storage from '../utils/storage';

let accessToken = null;

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.DEFAULT_TIMEOUT_MS || 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    storage.setItem('access_token', token);
  }
};

// Request interceptor to inject JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = accessToken;

      // Read token from local storage if in-memory cache is empty
      if (!token) {
        token = await storage.getItem('access_token');
        if (token) accessToken = token;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log outgoing requests for debugging
      if (__DEV__) {
        console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
      }

    } catch (e) {
      console.error('Error in request interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let lastAlertTime = 0;

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore canceled requests (unmount, search debounce, tab switch)
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.message === 'canceled') {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (originalRequest) originalRequest._retry = true;
      // Token expired or invalid
    }

    const now = Date.now();
    const isBackgroundGet = originalRequest?.method?.toLowerCase() === 'get';

    // Handle 500 Internal Server Error (only alert for user-triggered mutations or non-background)
    if (error.response?.status >= 500 && !isBackgroundGet) {
      if (now - lastAlertTime > 10000) {
        lastAlertTime = now;
        showGlobalAlert(
          'Server Busy',
          'Our kitchen is currently overwhelmed with orders! Please try again in a moment.',
          'warning'
        );
      }
    }

    // Handle Network Timeout/Disconnect (only alert for mutations, not background polling)
    if ((error.code === 'ECONNABORTED' || !error.response) && !isBackgroundGet) {
      if (now - lastAlertTime > 12000) {
        lastAlertTime = now;
        showGlobalAlert(
          'Connection Lost',
          'We can\'t reach the store right now. Please check your internet and try again.',
          'error'
        );
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
