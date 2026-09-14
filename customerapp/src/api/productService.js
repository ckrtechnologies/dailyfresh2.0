import apiClient from './apiClient';

const productService = {
  /**
   * Get all home screen data in a single call for better performance
   */
  getHomeData: async (storeId, deliveryType) => {
    try {
      const response = await apiClient.get('/customer/home', {
        params: { store_id: storeId, delivery_type: deliveryType }
      });
      return { success: true, data: response.data?.data || {} };
    } catch (error) {
      console.error('Error fetching home data:', error);
      return { success: false, error };
    }
  },

  /**
   * Fetch categories with subcategories
   */
  getCategories: async (storeId, deliveryType) => {
    try {
      const params = {
        ...(storeId ? { store_id: storeId } : {}),
        ...(deliveryType ? { delivery_type: deliveryType } : {})
      };
      const response = await apiClient.get('/customer/categories/tree', { params });
      const cats = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.categories || []);
      return { success: true, data: cats };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error };
    }
  },

  /**
   * Fetch banners
   */
  getBanners: async () => {
    try {
      const response = await apiClient.get('/customer/banners');
      const banners = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.banners || []);
      return { success: true, data: banners };
    } catch (error) {
      console.error('Error fetching banners:', error);
      return { success: false, error };
    }
  },

  /**
   * Fetch products with optional filters
   */
  getProducts: async ({
    categoryId,
    subCategoryId,
    storeId,
    search,
    isDeal,
    isFeatured,
    isFlashSale,
    isTrending,
    isExclusive,
    isNewLaunch,
    isFrozen,
    limit = 50,
    offset = 0
  } = {}) => {
    try {
      const params = {
        category_id: categoryId,
        sub_category_id: subCategoryId,
        store_id: storeId,
        search,
        is_deal: isDeal,
        is_featured: isFeatured,
        is_flash_sale: isFlashSale,
        is_trending: isTrending,
        is_exclusive: isExclusive,
        is_new_launch: isNewLaunch,
        is_frozen: isFrozen,
        limit,
        offset
      };

      // Strip undefined
      Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

      const response = await apiClient.get('/customer/products', { params });
      const products = Array.isArray(response.data?.data)
        ? response.data.data
        : (response.data?.data?.products || []);
      return { success: true, data: products };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { success: false, error };
    }
  },

  /**
   * Fetch subcategories for a given category ID
   */
  getSubCategories: async (categoryId) => {
    try {
      const response = await apiClient.get('/customer/categories/tree');
      const cats = Array.isArray(response.data?.data) 
        ? response.data.data 
        : (response.data?.data?.categories || []);
      const matched = cats.find(c => c.id === categoryId);
      const subs = matched?.subCategories || matched?.sub_categories || [];
      return { success: true, data: subs };
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Search products by name
   */
  searchProducts: async (query, storeId) => {
    try {
      const response = await apiClient.get('/customer/products', {
        params: { search: query, store_id: storeId }
      });
      return { success: true, data: response.data?.data?.products || [] };
    } catch (error) {
      console.error('Error searching products:', error);
      return { success: false, error };
    }
  },

  /**
   * Get a single product by slug or ID
   */
  getProductDetail: async (identifier) => {
    try {
      const response = await apiClient.get(`/customer/products/${identifier}`);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.error('Error fetching product detail:', error);
      return { success: false, error };
    }
  },

  /**
   * Get store details by ID
   */
  getStoreDetail: async (storeId) => {
    try {
      const response = await apiClient.get(`/customer/stores/${storeId}`);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.warn('Store detail fetch note:', error?.message || error);
      return { success: false, error };
    }
  },

  /**
   * Find nearest store based on lat/lng or pincode
   */
  findNearestStore: async (params) => {
    try {
      const response = await apiClient.get('/customer/stores/nearest', { params });
      return { success: true, data: response.data?.data || null };
    } catch (error) {
      console.error('Error finding nearest store:', error);
      return { success: false, error };
    }
  },

  /**
   * Get application settings (GST, Delivery Fees, etc.)
   */
  getSettings: async () => {
    try {
      const response = await apiClient.get('/app/config');
      return { success: true, data: response.data?.data || response.data || {} };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error };
    }
  }
};

export default productService;
