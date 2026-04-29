import apiClient from './apiClient';

const favoritesService = {
  getFavorites: async () => {
    try {
      const res = await apiClient.get('/customer/favorites');
      return res.data;
    } catch (error) {
      console.error('getFavorites error:', error);
      return { success: false, message: 'Failed to fetch favorites' };
    }
  },

  toggleFavorite: async (productId) => {
    try {
      const res = await apiClient.post('/customer/favorites/toggle', { productId });
      return res.data;
    } catch (error) {
      console.error('toggleFavorite error:', error);
      return { success: false, message: 'Failed to toggle favorite' };
    }
  },
};

export default favoritesService;
