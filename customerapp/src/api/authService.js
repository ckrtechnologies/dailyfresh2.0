import { supabase } from './supabase.js';

import { Linking } from 'react-native';

const authService = {
  /**
   * Login with Google SSO
   */
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'dailyfresh://login-callback',
          skipBrowserRedirect: true, // We will handle opening the URL manually
        },
      });

      if (error) throw error;

      if (data?.url) {
        // This is what actually opens the browser on the phone
        await Linking.openURL(data.url);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  },

  /**
   * Login with email and password
   * @param {string} email 
   * @param {string} password 
   */
  loginWithEmail: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          user: data.user,
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token
        }
      };
    } catch (error) {
      console.error('Supabase loginWithEmail error:', error);
      throw error;
    }
  },

  /**
   * Send OTP to phone or email
   * @param {string} type - 'phone' or 'email'
   * @param {string} identifier - phone number or email address
   */
  sendOTP: async (type, identifier) => {
    try {
      let result;
      if (type === 'phone') {
        result = await supabase.auth.signInWithOtp({
          phone: identifier.startsWith('+') ? identifier : `+91${identifier}`,
        });
      } else {
        result = await supabase.auth.signInWithOtp({
          email: identifier,
        });
      }

      if (result.error) throw result.error;
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Supabase sendOTP error:', error);
      throw error;
    }
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (type, identifier, otp) => {
    try {
      let result;
      if (type === 'phone') {
        result = await supabase.auth.verifyOtp({
          phone: identifier.startsWith('+') ? identifier : `+91${identifier}`,
          token: otp,
          type: 'sms',
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: identifier,
          token: otp,
          type: 'email',
        });
      }

      if (result.error) throw result.error;

      return {
        success: true,
        data: {
          user: result.data.user,
          access_token: result.data.session?.access_token,
          refresh_token: result.data.session?.refresh_token
        }
      };
    } catch (error) {
      console.error('Supabase verifyOTP error:', error);
      throw error;
    }
  },

  /**
   * Register new user
   * @param {Object} userData - { email, password, full_name, phone }
   */
  signUp: async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
          },
        },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Supabase signUp error:', error);
      throw error;
    }
  },

  /**
   * Get user profile from backend
   */
  getUserProfile: async () => {
    try {
      const { default: apiClient } = await import('./apiClient');
      const response = await apiClient.get('/customer/profile');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch profile' };
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

export default authService;
