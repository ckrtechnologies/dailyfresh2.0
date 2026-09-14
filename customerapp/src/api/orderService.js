import apiClient from './apiClient';

const orderService = {
  /**
   * Create a new order and get Razorpay Order ID
   */
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/customer/orders', orderData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create order' };
    }
  },

  /**
   * Verify Razorpay payment signature on backend
   */
  verifyPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/customer/payments/verify', paymentData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Payment verification failed:', error);
      return { success: false, error: error.response?.data?.message || 'Verification failed' };
    }
  },

  /**
   * Get user's order history
   */
  getMyOrders: async (filters = {}) => {
    try {
      const response = await apiClient.get('/customer/orders', { params: filters });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.warn('Orders fetch note:', error?.message || error);
      return { success: false, error };
    }
  },

  /**
   * Get specific order details
   */
  getOrderById: async (orderId) => {
    try {
      const response = await apiClient.get(`/customer/orders/${orderId}`);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.warn('Order detail fetch note:', error?.message || error);
      return { success: false, error };
    }
  },

  /**
   * Validate a coupon code
   */
  validateCoupon: async (code, orderAmount) => {
    try {
      const response = await apiClient.post('/customer/coupons/validate', { code, order_amount: orderAmount });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Invalid coupon' };
    }
  },

  /**
   * Get list of active coupons for customers
   */
  getAvailableCoupons: async () => {
    try {
      const response = await apiClient.get('/customer/coupons');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: 'Failed to load coupons' };
    }
  }
};

export default orderService;
