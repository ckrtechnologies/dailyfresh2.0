import apiClient, { setAccessToken } from './apiClient';
import storage from '../utils/storage';

const authService = {
  /**
   * Login with email and password via backend API
   * @param {string} email 
   * @param {string} password 
   */
  loginWithEmail: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const payload = response.data?.data;
      if (!payload?.access_token) {
        throw new Error(response.data?.message || 'Login failed');
      }

      const token = payload.access_token;
      const user = payload.user;

      // Persist access token in apiClient and storage
      setAccessToken(token);
      await storage.setItem('access_token', token);
      await storage.setItem('user', user);

      return {
        success: true,
        data: {
          user,
          access_token: token,
        },
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      console.error('[authService] loginWithEmail error:', message);
      throw new Error(message);
    }
  },

  /**
   * Login or Register via Google OAuth
   */
  signInWithGoogle: async (googlePayload = {}) => {
    try {
      const response = await apiClient.post('/auth/google', googlePayload);
      const payload = response.data?.data;
      if (!payload?.access_token) {
        throw new Error(response.data?.message || 'Google sign-in failed');
      }

      const token = payload.access_token;
      const user = payload.user;

      setAccessToken(token);
      await storage.setItem('access_token', token);
      await storage.setItem('user', user);

      return {
        success: true,
        data: {
          user,
          access_token: token,
        },
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Google sign-in failed';
      console.error('[authService] signInWithGoogle error:', message);
      throw new Error(message);
    }
  },

  /**
   * Register new customer via backend API
   * @param {Object} userData - { email, password, full_name, phone }
   */
  signUp: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        full_name: userData.full_name,
        phone: userData.phone,
        role: 'customer',
      });

      const payload = response.data?.data;
      if (payload?.access_token) {
        setAccessToken(payload.access_token);
        await storage.setItem('access_token', payload.access_token);
        if (payload.user) {
          await storage.setItem('user', payload.user);
        }
      }

      return {
        success: true,
        data: payload,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      console.error('[authService] signUp error:', message);
      throw new Error(message);
    }
  },

  /**
   * Get user profile from backend
   */
  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/customer/profile');
      return { success: true, data: response.data.data.user };
    } catch (error) {
      console.error('[authService] Error fetching user profile:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch profile' };
    }
  },

  /**
   * Update user profile in backend
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.patch('/auth/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[authService] Error updating user profile:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
    }
  },

  /**
   * Logout user and clear stored credentials
   */
  logout: async () => {
    try {
      setAccessToken(null);
      await storage.removeItem('access_token');
      await storage.removeItem('user');
      await storage.removeItem('selected_address');
      await storage.removeItem('pincode');
      await storage.removeItem('store_id');
      await storage.removeItem('store_name');
    } catch (error) {
      console.warn('[authService] Error during logout:', error);
    }
  },

  /**
   * Delete Account
   */
  deleteAccount: async () => {
    try {
      const response = await apiClient.delete('/customer/profile');
      setAccessToken(null);
      await storage.removeItem('access_token');
      await storage.removeItem('user');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[authService] Error deleting account:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete account' };
    }
  },
};

export default authService;
