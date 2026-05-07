import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * List all products with filters
 */
export const listProducts = async (req, res) => {
  const { category_id, sub_category_id, store_id, delivery_type, is_featured, is_deal, is_flash_sale, is_frozen, is_trending, is_exclusive, is_new_launch, search } = req.query;

  try {
    if (!store_id) {
      return successResponse(res, { products: [] }, 'Please select a location to view products');
    }

    const stockColumn = delivery_type === 'express' ? 'express_stock_qty' : 'scheduled_stock_qty';

    let query = supabaseAdmin
      .from('products')
      .select('*, store:stores(name), sub_category:sub_categories(name)')
      .eq('is_active', true)
      .eq('store_id', store_id)
      .gt(stockColumn, 0);

    if (delivery_type) {
      if (delivery_type === 'tomorrow') {
        // JSONB containment check using OR
        query = query.or('delivery_options.cs.["tomorrow_morning"],delivery_options.cs.["tomorrow_evening"]');
      } else {
        query = query.contains('delivery_options', JSON.stringify([delivery_type]));
      }
    }

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

/**
 * Get all home screen data in a single request for performance
 */
export const getHomeData = async (req, res) => {
  const { store_id, delivery_type } = req.query;

  if (!store_id) {
    return errorResponse(res, 'Store ID is required', 400);
  }

  try {
    const stockColumn = delivery_type === 'express' ? 'express_stock_qty' : 'scheduled_stock_qty';

    // 1. Fetch Banners
    const bannersPromise = supabaseAdmin.from('banners').select('*').eq('is_active', true).order('display_order');

    // 2. Fetch Categories
    const categoriesPromise = supabaseAdmin.from('categories').select('*').eq('is_active', true).order('display_order');

    // 3. Helper for product queries
    const getProductQuery = () => {
      let q = supabaseAdmin
        .from('products')
        .select('*, store:stores(name), sub_category:sub_categories(name)')
        .eq('is_active', true)
        .eq('store_id', store_id);

      if (delivery_type) {
        if (delivery_type === 'tomorrow') {
          q = q.or('delivery_options.cs.["tomorrow_morning"],delivery_options.cs.["tomorrow_evening"]');
        } else {
          q = q.contains('delivery_options', JSON.stringify([delivery_type]));
        }
      }
      return q;
    };

    // 4. Execute all queries in parallel
    const [
      bannersRes,
      categoriesRes,
      featuredRes,
      dealsRes,
      flashRes,
      frozenRes,
      trendingRes,
      newLaunchRes,
      exclusiveRes
    ] = await Promise.all([
      bannersPromise,
      categoriesPromise,
      getProductQuery().eq('is_featured', true).limit(10),
      getProductQuery().eq('is_deal', true).limit(10),
      getProductQuery().eq('is_flash_sale', true).limit(10),
      getProductQuery().eq('is_frozen', true).limit(10),
      getProductQuery().eq('is_trending', true).limit(10),
      getProductQuery().eq('is_new_launch', true).limit(10),
      getProductQuery().eq('is_exclusive', true).limit(10)
    ]);

    // 5. Fetch Category Sections (All active categories with products)
    const allCategories = categoriesRes.data || [];
    const categorySections = await Promise.all(
      allCategories.map(async (cat) => {
        const { data: subCats } = await supabaseAdmin.from('sub_categories').select('id').eq('category_id', cat.id);
        const subCatIds = (subCats || []).map(sc => sc.id);

        let productsData = [];
        if (subCatIds.length > 0) {
          const { data } = await getProductQuery().in('sub_category_id', subCatIds).limit(8);
          productsData = data || [];
        }

        if (productsData.length === 0) return null;

        return {
          id: cat.id,
          title: cat.name,
          products: productsData,
          display_order: cat.display_order || 0
        };
      })
    );

    const validSections = categorySections.filter(s => s !== null).sort((a, b) => a.display_order - b.display_order);

    return successResponse(res, {
      banners: bannersRes.data || [],
      categories: allCategories,
      featuredProducts: featuredRes.data || [],
      todaysDeals: dealsRes.data || [],
      flashSale: flashRes.data || [],
      frozenProducts: frozenRes.data || [],
      trendingProducts: trendingRes.data || [],
      newLaunch: newLaunchRes.data || [],
      exclusiveOffers: exclusiveRes.data || [],
      categorySections: validSections
    }, 'Home data fetched successfully');

  } catch (error) {
    console.error('[HomeData API] Error:', error);
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
