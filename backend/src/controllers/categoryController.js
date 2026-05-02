import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all categories (Top-level)
 */
export const getCategories = async (req, res) => {
  const { delivery_type, store_id } = req.query;
  
  try {
    if (!store_id) {
      return successResponse(res, { categories: [] });
    }

    const stockColumn = delivery_type === 'express' ? 'express_stock_qty' : 'scheduled_stock_qty';

    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        sub_categories(
          id,
          products(id, is_active, store_id, ${stockColumn}, delivery_options)
        )
      `)
      .eq('is_active', true);

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
       console.error('[GetCategories Error]', error);
       return errorResponse(res, 'Failed to fetch categories', 400, error);
    }

    // Filter in JS to ensure we only show categories that have at least one product
    // matching the store and delivery type (if provided)
    const filteredCategories = data.filter(cat => {
      return cat.sub_categories?.some(sc => 
        sc.products?.some(p => 
          p.is_active && 
          p.store_id === store_id && 
          p[stockColumn] > 0 &&
          (!delivery_type || (p.delivery_options && p.delivery_options.includes(delivery_type)))
        )
      );
    });

    const cleanCategories = (filteredCategories.length > 0 ? filteredCategories : data).map(({ sub_categories, ...cat }) => cat);
    return successResponse(res, { categories: cleanCategories });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get subcategories for a given category
 */
export const getSubCategories = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('sub_categories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) return errorResponse(res, 'Failed to fetch subcategories', 400, error);

    return successResponse(res, { sub_categories: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get category hierarchy tree
 */
export const getCategoryTree = async (req, res) => {
  const { delivery_type, store_id } = req.query;

  try {
    if (!store_id) {
       return successResponse(res, { tree: [] });
    }

    const stockColumn = delivery_type === 'express' ? 'express_stock_qty' : 'scheduled_stock_qty';

    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        sub_categories(
          *,
          products(id, is_active, store_id, ${stockColumn}, delivery_options)
        )
      `)
      .eq('is_active', true);

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
       console.error('[GetCategoryTree Error]', error);
       return errorResponse(res, 'Failed to fetch category tree', 400, error);
    }

    const tree = data.map(cat => {
      const filteredSubCats = cat.sub_categories.map(({ products, ...sc }) => {
        const hasProducts = products?.some(p => 
          p.is_active && 
          p.store_id === store_id && 
          p[stockColumn] > 0 &&
          (!delivery_type || (p.delivery_options && p.delivery_options.includes(delivery_type)))
        );
        return hasProducts ? sc : null;
      }).filter(Boolean);

      return {
        ...cat,
        sub_categories: filteredSubCats
      };
    }).filter(cat => cat.sub_categories.length > 0 || !delivery_type);

    return successResponse(res, { tree });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
