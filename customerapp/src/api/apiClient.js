import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log outgoing requests for debugging
      console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
      
    } catch (e) {
      console.error('Error reading token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh or errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Handle token refresh logic here
    }
    return Promise.reject(error);
  }
);

export default apiClient;
