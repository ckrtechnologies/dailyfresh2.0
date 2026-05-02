import { supabase } from './supabase';
import apiClient from './apiClient';

const productService = {
  /**
   * Get all active categories
   */
  getCategories: async (deliveryType, storeId) => {
    try {
      const response = await apiClient.get('/customer/categories', {
        params: { delivery_type: deliveryType, store_id: storeId }
      });
      return { success: true, data: response.data?.data?.categories || [] };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error };
    }
  },

  /**
   * Get banners for home page
   */
  getBanners: async () => {
    try {
      // Call backend API — it applies is_active + valid_from/valid_until date filters
      const response = await apiClient.get('/customer/banners');
      return { success: true, data: response.data?.data?.banners || [] };
    } catch (error) {
      console.error('Error fetching banners:', error);
      return { success: true, data: [] }; // Graceful fallback — don't break home screen
    }
  },

  /**
   * Get products with optional filters (Hits Backend API)
   */
  getProducts: async (filters = {}) => {
    try {

      // Map frontend filter names to backend expected names if different
      const params = {
        is_featured: filters.isFeatured,
        is_deal: filters.isDeal,
        is_flash_sale: filters.isFlashSale,
        is_frozen: filters.isFrozen,
        is_trending: filters.isTrending,
        is_exclusive: filters.isExclusive,
        is_new_launch: filters.isNewLaunch,
        sub_category_id: filters.subCategoryId,
        category_id: filters.categoryId,
        store_id: filters.storeId,
        delivery_type: filters.deliveryType,
        search: filters.search
      };

      // Clean up undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiClient.get('/customer/products', { params });
      return { success: true, data: response.data?.data?.products || [] };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch products' };
    }
  },

  /**
   * Get a single product by slug or ID
   */
  getProductDetail: async (identifier) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          sub_category:sub_categories!sub_category_id(
            *,
            category:categories!category_id(*)
          ),
          store:stores!store_id(*),
          variants:product_variants(*)
        `)
        .or(`slug.eq.${identifier},id.eq.${identifier}`)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching product detail:', error);
      return { success: false, error };
    }
  },

  getStoreDetail: async (storeId) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching store detail:', error);
      return { success: false, error };
    }
  },

  /**
   * Get application settings (GST, Delivery Fees, etc.)
   */
  getSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      // Convert array of {key, value} to an object
      const settingsMap = (data || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      return { success: true, data: settingsMap };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error };
    }
  }
};

export default productService;
