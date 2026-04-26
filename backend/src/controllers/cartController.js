import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get User Cart Items
 */
export const getCart = async (req, res) => {
  try {
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        *,
        product:products (*)
      `)
      .eq('user_id', req.user.id);

    if (error) return errorResponse(res, 'Failed to fetch cart', 400, error);

    return successResponse(res, 'Cart fetched successfully', { items: cartItems });
  } catch (error) {
    return errorResponse(res, 'Server error fetching cart', 500, error);
  }
};

/**
 * Add or Update Cart Item
 */
export const syncCart = async (req, res) => {
  try {
    const { items } = req.body; // Expecting array of cart items

    if (!Array.isArray(items)) {
      return errorResponse(res, 'Invalid items format', 400);
    }

    // 1. Delete existing cart items for user
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    // 2. Insert new items
    if (items.length > 0) {
      const cartData = items.map(item => ({
        user_id: req.user.id,
        product_id: item.id || item.product_id,
        quantity: item.quantity,
        cut_preference: item.cutPreference || item.cut_preference,
        cleaning_preference: item.cleaningPreference || item.cleaning_preference
      }));

      const { error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert(cartData);

      if (insertError) {
        console.error('[Cart Sync Error]', insertError);
        return errorResponse(res, 'Failed to sync cart', 400, insertError);
      }
    }

    return successResponse(res, 'Cart synced successfully');
  } catch (error) {
    return errorResponse(res, 'Server error syncing cart', 500, error);
  }
};

/**
 * Clear Cart
 */
export const clearCart = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    if (error) return errorResponse(res, 'Failed to clear cart', 400, error);

    return successResponse(res, 'Cart cleared successfully');
  } catch (error) {
    return errorResponse(res, 'Server error clearing cart', 500, error);
  }
};
