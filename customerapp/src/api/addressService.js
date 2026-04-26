import apiClient from './apiClient';

const addressService = {
  /**
   * Fetch all saved addresses for the current user
   */
  getAddresses: async () => {
    try {
      const response = await apiClient.get('/customer/addresses');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Add a new delivery address
   */
  addAddress: async (addressData) => {
    try {
      const response = await apiClient.post('/customer/addresses', addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an existing address
   */
  updateAddress: async (id, addressData) => {
    try {
      const response = await apiClient.patch(`/customer/addresses/${id}`, addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete an address
   */
  deleteAddress: async (id) => {
    try {
      const response = await apiClient.delete(`/customer/addresses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default addressService;
