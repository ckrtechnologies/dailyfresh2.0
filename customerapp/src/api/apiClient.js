import axios from 'axios';
import Config from 'react-native-config';
import { showGlobalAlert } from '../services/alertService';

let accessToken = null;

const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAccessToken = (token) => {
  accessToken = token;
};

// Request interceptor to inject JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Log outgoing requests for debugging
      console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');

    } catch (e) {
      console.error('Error in request interceptor', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Handle token refresh logic here if needed
    }

    // Handle 500 Internal Server Error
    if (error.response?.status >= 500) {
      showGlobalAlert(
        'Server Busy',
        'Our kitchen is currently overwhelmed with orders! Please try again in a moment.',
        'warning'
      );
    }

    // Handle Network Timeout/Disconnect
    if (error.code === 'ECONNABORTED' || !error.response) {
      showGlobalAlert(
        'Connection Lost',
        'We can\'t reach the store right now. Please check your internet and try again.',
        'error'
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
