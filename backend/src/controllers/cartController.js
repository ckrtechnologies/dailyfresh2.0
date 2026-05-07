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

/**
 * Validate Cart against a specific Store ID (Option B)
 */
export const validateCart = async (req, res) => {
  try {
    const { items, storeId } = req.body;
    if (!items || !Array.isArray(items) || !storeId) {
      return errorResponse(res, 'Items array and Store ID are required', 400);
    }

    const productIds = items.map(it => it.product?.id || it.id).filter(id => id);
    const variantIds = items.map(it => it.variant?.id).filter(id => id);

    console.log(`[validateCart] Validating ${productIds.length} products for Store: ${storeId}`);

    if (!storeId) {
      console.log('[validateCart] No storeId provided. Marking all items as removed (unserviceable location).');
      return successResponse(res, {
        items: [],
        hasChanges: true,
        changes: {
          removed: items.map(it => it.name || it.product?.name),
          priceChanged: [],
          outOfStock: []
        }
      });
    }
    const { data: storeProducts } = await supabaseAdmin
      .from('products')
      .select('*, sub_category:sub_categories(name)')
      .eq('store_id', storeId)
      .in('id', productIds);

    const { data: allStoreProducts } = await supabaseAdmin.from('products').select('id, name').eq('store_id', storeId);
    console.log(`[validateCart] Target Store: ${storeId}. DB Products found:`, allStoreProducts?.map(p => `${p.name} (${p.id})`));
    console.log(`[validateCart] Matching products for cart IDs:`, storeProducts?.map(p => p.id));

    console.log(`[validateCart] Found ${storeProducts?.length || 0} matching products in DB for this store`);

    // 2. Fetch current status of these variants
    let storeVariants = [];
    if (variantIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('product_variants')
        .select('*')
        .in('id', variantIds);
      storeVariants = data || [];
    }

    const productMap = (storeProducts || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
    const variantMap = (storeVariants || []).reduce((acc, v) => { acc[v.id] = v; return acc; }, {});

    const validatedItems = [];
    const changes = {
      removed: [],
      priceChanged: [],
      outOfStock: []
    };

    items.forEach(item => {
      const pId = item.product?.id || item.id;
      const vId = item.variant?.id;
      
      const dbProduct = productMap[pId];
      const dbVariant = vId ? variantMap[vId] : null;

      console.log(`[validateCart] Processing Item - Name: ${item.name || item.product?.name}, ID: ${pId}, Store in Cart: ${item.store_id}, dbProduct found: ${!!dbProduct}`);

      // Rule 1: Does the product exist in the new store?
      if (!dbProduct) {
        changes.removed.push({ name: item.product?.name || 'Unknown Item', reason: 'Not available at this location' });
        return;
      }

      // Rule 2: If it's a variant, does the variant exist? (Variants belong to products, but let's be safe)
      if (vId && !dbVariant) {
        changes.removed.push({ name: item.variant?.name || item.product?.name, reason: 'Variant not available' });
        return;
      }

      // Rule 3: Check Stock
      // Note: We check both express and scheduled since we don't know the slot yet, 
      // but if both are 0, it's definitely out of stock.
      const totalStock = (dbProduct.express_stock_qty || 0) + (dbProduct.scheduled_stock_qty || 0);
      if (totalStock <= 0) {
        changes.outOfStock.push({ name: dbProduct.name });
        return;
      }

      // Rule 4: Check Price Change
      const currentPrice = dbVariant ? (dbVariant.discount_price || dbVariant.price) : (dbProduct.discount_price || dbProduct.price);
      const oldPrice = item.variant ? (item.variant.discount_price || item.variant.price) : (item.product?.discount_price || item.product?.price || item.price);

      if (Number(currentPrice) !== Number(oldPrice)) {
        changes.priceChanged.push({ 
          name: dbVariant ? dbVariant.name : dbProduct.name, 
          oldPrice, 
          newPrice: currentPrice 
        });
      }

      // If we reached here, the item is kept (possibly with price update)
      validatedItems.push({
        ...item,
        product: dbProduct,
        variant: dbVariant,
        store_id: storeId, // Link to new store
        price: currentPrice // Ensure price is fresh
      });
    });

    return successResponse(res, 'Cart validated', {
      items: validatedItems,
      changes,
      hasChanges: changes.removed.length > 0 || changes.priceChanged.length > 0 || changes.outOfStock.length > 0
    });

  } catch (error) {
    console.error('[validateCart] Error:', error);
    return errorResponse(res, 'Server error validating cart', 500, error);
  }
};
