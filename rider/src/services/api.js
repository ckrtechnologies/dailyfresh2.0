import axios from 'axios';
import { Config } from 'react-native-config';
import { store } from '../store';

const API_URL = Config.API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request Interceptor to add Auth Token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.rider.token;
    
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(`🔥 [API Response Error] ${error.response?.status} ${error.config?.url}`, error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('⚠️ Unauthorized request - session might have expired');
    }
    return Promise.reject(error);
  }
);

export default api;
