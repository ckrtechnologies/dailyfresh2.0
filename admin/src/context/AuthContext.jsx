import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('df_admin_user');
    const storedToken = localStorage.getItem('df_admin_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data.data;
      
      // Ensure the user has admin or store_manager role
      if (userData.role !== 'admin' && userData.role !== 'store_manager') {
        throw new Error('Access denied: Unauthorized role.');
      }

      setUser(userData);
      localStorage.setItem('df_admin_token', access_token);
      localStorage.setItem('df_admin_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('df_admin_token');
    localStorage.removeItem('df_admin_user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isStoreManager: user?.role === 'store_manager'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
