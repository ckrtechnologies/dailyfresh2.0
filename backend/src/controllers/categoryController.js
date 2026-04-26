import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all categories (Top-level)
 */
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) return errorResponse(res, 'Failed to fetch categories', 400, error);

    return successResponse(res, { categories: data });
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
  try {
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (catError) return errorResponse(res, 'Failed to fetch categories', 400, catError);

    const { data: subCategories, error: subError } = await supabaseAdmin
      .from('sub_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (subError) return errorResponse(res, 'Failed to fetch subcategories', 400, subError);

    const tree = categories.map(cat => ({
      ...cat,
      sub_categories: subCategories.filter(sc => sc.category_id === cat.id)
    }));

    return successResponse(res, { tree });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
