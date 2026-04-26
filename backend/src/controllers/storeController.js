import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Helper to get the store ID assigned to the logged-in manager
 */
const getAssignedStoreId = async (managerId) => {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('manager_user_id', managerId)
    .single();
  
  if (error || !data) return null;
  return data.id;
};

/**
 * Get Dashboard KPIs for the store
 */
export const getDashboard = async (req, res) => {
  try {
    const storeId = await getAssignedStoreId(req.user.id);
    if (!storeId) return errorResponse(res, 'No store assigned to this manager', 404);

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity')
      .eq('store_id', storeId);

    const lowStockCount = products.filter(p => p.stock_quantity < 10).length;

    return successResponse(res, {
      store_id: storeId,
      total_products: products.length,
      low_stock_alerts: lowStockCount
    }, 'Dashboard stats fetched');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List products for the manager's store
 */
export const getInventory = async (req, res) => {
  try {
    const storeId = await getAssignedStoreId(req.user.id);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, sub_category:sub_categories(name)')
      .eq('store_id', storeId);

    if (error) return errorResponse(res, 'Failed to fetch inventory', 400, error);
    return successResponse(res, { products: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update stock for a specific product
 */
export const updateStock = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  try {
    const storeId = await getAssignedStoreId(req.user.id);
    
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('store_id')
      .eq('id', productId)
      .single();

    if (!product || product.store_id !== storeId) {
      return errorResponse(res, 'Access denied: Product does not belong to your store', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ stock_quantity: quantity })
      .eq('id', productId)
      .select()
      .single();

    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { product: data }, 'Stock updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List orders for the manager's store
 */
export const getOrders = async (req, res) => {
  try {
    const storeId = await getAssignedStoreId(req.user.id);
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch orders', 400, error);
    return successResponse(res, { orders: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Haversine distance in km between two lat/lng points
 */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * GET /customer/stores/nearest?lat=&lng=&pincode=
 *
 * Priority:
 *  1. GPS lat/lng → nearest store within delivery_radius_km
 *  2. Pincode match → exact pincode store
 *  3. Fallback → first active store (single-store / test mode)
 */
export const getNearestStore = async (req, res) => {
  const { lat, lng, pincode } = req.query;

  try {
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('id, name, pincode, latitude, longitude, delivery_radius_km, address, phone, serviceable_pincodes')
      .eq('is_active', true);

    if (error) throw error;
    if (!stores || stores.length === 0) {
      return errorResponse(res, 'No active stores found', 404);
    }

    let selected = null;

    // Strategy 1: GPS-based — nearest store within delivery radius
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const withDistance = stores
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          ...s,
          distance_km: haversine(userLat, userLng, parseFloat(s.latitude), parseFloat(s.longitude)),
        }))
        .filter(s => s.distance_km <= (s.delivery_radius_km || 10))
        .sort((a, b) => a.distance_km - b.distance_km);

      selected = withDistance[0] || null;
      
      // If GPS is provided, it is our source of truth. 
      // If no store is found within radius, we stop here (don't fallback to pincode)
      if (selected || (lat && lng)) {
         return successResponse(res, { 
            store: selected,
            is_serviceable: !!selected,
            distance: selected ? selected.distance_km.toFixed(2) : null
          }, selected ? 'Nearest store found via GPS' : 'No store within 10km radius');
      }
    }

    // Strategy 2: Pincode match fallback
    if (!selected && pincode) {
      const pStr = pincode.toString();
      // 2a. Priority: Exact primary pincode match
      selected = stores.find(s => s.pincode === pStr) || null;
      
      // 2b. Fallback: Check serviceable_pincodes array
      if (!selected) {
        selected = stores.find(s => 
          s.serviceable_pincodes && 
          Array.isArray(s.serviceable_pincodes) && 
          s.serviceable_pincodes.includes(pStr)
        ) || null;
      }
    }

    // Strategy 3: Removed fallback — if not in range/pincode, return null
    // This allows the frontend to show "Coming Soon" or "Not Serviceable"

    return successResponse(res, { 
      store: selected,
      is_serviceable: !!selected 
    }, selected ? 'Nearest store found' : 'Location not serviceable');
  } catch (error) {
    console.error('[getNearestStore]', error);
    return errorResponse(res, 'Failed to find nearest store', 500, error);
  }
};
