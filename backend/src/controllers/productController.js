import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * List all products with filters
 */
export const listProducts = async (req, res) => {
  const { category_id, sub_category_id, store_id, is_featured, is_deal, is_flash_sale, is_frozen, is_trending, is_exclusive, is_new_launch, search } = req.query;

  try {
    if (!store_id) {
       return successResponse(res, { products: [] }, 'Please select a location to view products');
    }

    let query = supabaseAdmin
      .from('products')
      .select('*, store:stores(name), sub_category:sub_categories(name)')
      .eq('is_active', true)
      .eq('store_id', store_id);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category_id) {
       let targetCategoryId = category_id;
       
       // If it looks like a slug (not a UUID), find the ID first
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
       if (!uuidRegex.test(category_id)) {
         const { data: catData, error: catError } = await supabaseAdmin
           .from('categories')
           .select('id')
           .eq('slug', category_id)
           .single();
         
         if (catData) {
           targetCategoryId = catData.id;
         } else {
           // If slug doesn't exist, return empty
           return successResponse(res, { products: [] });
         }
       }

       // Filtering by category requires a join via sub_categories
       const { data: subCats, error: subError } = await supabaseAdmin
         .from('sub_categories')
         .select('id')
         .eq('category_id', targetCategoryId);

       if (subError) throw subError;
       
       const subCatIds = (subCats || []).map(sc => sc.id);
       if (subCatIds.length > 0) {
         query = query.in('sub_category_id', subCatIds);
       } else {
         // If no subcategories found for this category, the query should return nothing
         query = query.eq('sub_category_id', '00000000-0000-0000-0000-000000000000');
       }
    }

    if (sub_category_id) query = query.eq('sub_category_id', sub_category_id);
    if (store_id) query = query.eq('store_id', store_id);
    
    // Boolean filters
    if (is_featured === 'true' || is_featured === true) query = query.eq('is_featured', true);
    if (is_deal === 'true' || is_deal === true) query = query.eq('is_deal', true);
    if (is_flash_sale === 'true' || is_flash_sale === true) query = query.eq('is_flash_sale', true);
    if (is_frozen === 'true' || is_frozen === true) query = query.eq('is_frozen', true);
    if (is_trending === 'true' || is_trending === true) query = query.eq('is_trending', true);
    if (is_exclusive === 'true' || is_exclusive === true) query = query.eq('is_exclusive', true);
    if (is_new_launch === 'true' || is_new_launch === true) query = query.eq('is_new_launch', true);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch products', 400, error);
    return successResponse(res, { products: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get single product details
 */
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, store:stores(*), sub_category:sub_categories(*), variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error) return errorResponse(res, 'Product not found', 404, error);
    return successResponse(res, { product: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Decrement Stock API
 * Body: { items: [{ product_id: string, quantity: number }] }
 */
export const decrementStock = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return errorResponse(res, 'Invalid items array', 400);
  }

  try {
    const results = [];
    for (const item of items) {
      // 1. Fetch current stock
      const { data: product, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('stock_quantity, name')
        .eq('id', item.product_id)
        .single();

      if (fetchError || !product) {
        console.error(`[Stock API] Product ${item.product_id} not found`);
        continue;
      }

      // 2. Calculate new stock
      const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);

      // 3. Update stock
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`[Stock API] Failed to update product ${item.product_id}:`, updateError);
      } else {
        results.push({ id: item.product_id, name: product.name, old_stock: product.stock_quantity, new_stock: newStock });
      }
    }

    return successResponse(res, { results }, 'Stock decremented successfully');
  } catch (error) {
    console.error('[Stock API] Error:', error);
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
