import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getFavorites = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*, product:products(*)')
      .eq('user_id', req.user.id);

    if (error) throw error;
    
    // Format to match frontend product structure
    const products = (data || []).map(fav => fav.product).filter(p => p !== null);
    
    return successResponse(res, products, 'Favorites fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch favorites', 500, error);
  }
};

export const toggleFavorite = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return errorResponse(res, 'Product ID is required', 400);

  try {
    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('user_favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      // Delete
      await supabaseAdmin
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);
      
      return successResponse(res, { isFavorite: false }, 'Removed from favorites');
    } else {
      // Insert
      const { error: insertError } = await supabaseAdmin
        .from('user_favorites')
        .insert([{ user_id: req.user.id, product_id: productId }]);

      if (insertError) throw insertError;
      
      return successResponse(res, { isFavorite: true }, 'Added to favorites');
    }
  } catch (error) {
    return errorResponse(res, 'Failed to toggle favorite', 500, error);
  }
};
