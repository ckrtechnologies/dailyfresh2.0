import apiClient from './apiClient';

const cartService = {
  /**
   * Fetch saved cart from backend
   */
  getCart: async () => {
    try {
      const response = await apiClient.get('/customer/cart');
      return { success: true, data: response.data.data.items };
    } catch (error) {
      console.warn('Cart fetch note:', error?.message || error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch cart' };
    }
  },

  /**
   * Sync current local cart with backend
   */
  syncCart: async (items) => {
    try {
      const response = await apiClient.post('/customer/cart/sync', { items });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error syncing cart:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to sync cart' };
    }
  },

  
  /**
   * Clear backend cart
   */
  clearCart: async () => {
    try {
      await apiClient.delete('/customer/cart');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    }
  },

  /**
   * Validate cart items against a new store (Cross-store validation)
   */
  validateCart: async (items, storeId) => {
    try {
      const response = await apiClient.post('/customer/cart/validate', { items, storeId });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error validating cart:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to validate cart' };
    }
  }
};  

export default cartService;