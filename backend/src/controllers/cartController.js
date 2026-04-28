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
        product:products (*),
        variant:product_variants (*)
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
      // Pre-fetch missing store_ids to avoid NOT NULL violation
      const productIds = items.map(it => it.id || it.product_id).filter(id => id);
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, store_id')
        .in('id', productIds);

      const productStoreMap = (products || []).reduce((acc, p) => {
        acc[p.id] = p.store_id;
        return acc;
      }, {});

      const cartData = items.map(item => {
        const pId = item.id || item.product_id;
        return {
          user_id: req.user.id,
          product_id: pId,
          variant_id: item.variant?.id || item.variant_id || null,
          store_id: item.store_id || item.product?.store_id || productStoreMap[pId] || null,
          quantity: item.quantity,
          cut_preference: item.cutPreference || item.cut_preference,
          cleaning_preference: item.cleaningPreference || item.cleaning_preference
        };
      });

      // Filter out items that still lack product_id or store_id to prevent DB error
      const validCartData = cartData.filter(d => d.product_id && d.store_id);

      if (validCartData.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('cart_items')
          .insert(validCartData);

        if (insertError) {
          console.error('[Cart Sync Error]', insertError);
          return errorResponse(res, 'Failed to sync cart', 400, insertError);
        }
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
