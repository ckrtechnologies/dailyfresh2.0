import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';
import { successResponse, errorResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';
import { validateTransition } from '../utils/statusTransitions.js';

/**
 * Helper to get the store ID assigned to the logged-in manager
 */
/**
 * Resolves the store ID for a manager.
 * Priority: 
 * 1. x-store-id header (validated against ownership)
 * 2. First store found in DB for this manager
 */
const resolveStoreId = async (req) => {
  const managerId = req.user.id;
  const headerStoreId = req.headers['x-store-id'];

  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('manager_user_id', managerId);

  if (error || !stores || stores.length === 0) return null;

  // If a specific store is requested via header, check if it's one of theirs
  if (headerStoreId) {
    const matched = stores.find(s => s.id === headerStoreId);
    if (matched) return matched.id;
  }

  // Default to the first store
  return stores[0].id;
};

export const getMyStores = async (req, res) => {
  try {
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('manager_user_id', req.user.id);

    if (error) throw error;
    return successResponse(res, { stores });
  } catch (error) {
    console.error('[getMyStores] Error:', error);
    return errorResponse(res, error.message);
  }
};

const getImageUrl = (file, bodyUrl) => {
  if (file) {
    const baseUrl = (process.env.CDN_BASE_URL || 'https://assets.dailyfreshkolkata.in/uploads').replace(/\/$/, '');
    return `${baseUrl}/${file.filename}`;
  }
  return bodyUrl || null;
};

const safeParseOptions = (options, defaultVal = []) => {
  if (!options) return defaultVal;
  if (Array.isArray(options)) return options;
  if (typeof options !== 'string') return defaultVal;
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return options.split(',').map(s => s.trim()).filter(s => s);
  }
};

const syncProductVariants = async (productId, variants, files = []) => {
  if (!Array.isArray(variants)) return;
  try {
    // Process files for variants
    const variantImages = {};
    if (files && files.length > 0) {
      files.forEach(f => {
        if (f.fieldname.startsWith('variant_image_')) {
          const index = f.fieldname.replace('variant_image_', '');
          variantImages[index] = getImageUrl(f);
        }
      });
    }

    const { data: existing } = await supabaseAdmin.from('product_variants').select('id').eq('product_id', productId);
    const existingIds = (existing || []).map(v => v.id);
    const incomingIds = variants.map(v => v.id).filter(id => id);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    if (idsToDelete.length > 0) {
      await supabaseAdmin.from('product_variants').delete().in('id', idsToDelete);
    }

    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const generateUUID = () => {
      try {
        return crypto.randomUUID();
      } catch (e) {
        // Fallback for older Node versions
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
          (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
        );
      }
    };

    const variantsToUpsert = variants.map((v, index) => {
      const record = {
        product_id: productId,
        name: v.name,
        description: v.description || null,
        price: parseFloat(v.price) || 0,
        discount_price: (v.discount_price && v.discount_price !== '' && v.discount_price !== 'null') ? parseFloat(v.discount_price) : null,
        weight_text: v.weight_text || null,
        gross_weight_text: v.gross_weight_text || null,
        delivery_info: (v.delivery_info && Array.isArray(v.delivery_info)) ? v.delivery_info : (v.delivery_info ? [v.delivery_info] : ['Tomorrow Morning']),
        image_url: variantImages[index.toString()] || v.image_url || null,
        display_order: v.display_order || 0
      };
      if (v.id && isUUID(v.id)) record.id = v.id;
      else record.id = generateUUID();
      return record;
    });

    if (variantsToUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('product_variants')
        .upsert(variantsToUpsert, { onConflict: 'id' });
      if (upsertError) throw upsertError;
    }
  } catch (error) {
    console.error('[Store] Variant sync error:', error);
    throw error;
  }
};

/**
 * Get Dashboard KPIs for the store
 */
export const getDashboard = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) return errorResponse(res, 'No store assigned to this manager', 404);

    const { startDate, endDate } = req.query;

    // 1. Fetch Products within range (to see how many were added/active in this period)
    let productsQuery = supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity, created_at')
      .eq('store_id', storeId);

    if (startDate) productsQuery = productsQuery.gte('created_at', startDate);
    if (endDate) productsQuery = productsQuery.lte('created_at', endDate);

    const { data: products } = await productsQuery;
    const lowStockCount = products ? products.filter(p => p.stock_quantity < 10).length : 0;

    // 2. Fetch Orders within range
    let orderQuery = supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, created_at')
      .eq('store_id', storeId);

    if (startDate) orderQuery = orderQuery.gte('created_at', startDate);
    if (endDate) orderQuery = orderQuery.lte('created_at', endDate);

    const { data: orders } = await orderQuery;

    let totalRevenue = 0;
    let activeOrders = 0;
    let totalOrders = 0;

    if (orders) {
      totalOrders = orders.length;
      orders.forEach(o => {
        // Only count non-cancelled orders for revenue
        if (o.status !== 'cancelled') {
          totalRevenue += Number(o.total_amount) || 0;
        }
        // Count anything not delivered or cancelled as active
        if (o.status !== 'delivered' && o.status !== 'cancelled') {
          activeOrders++;
        }
      });
    }

    // 3. Latest 5 Orders (within range)
    let latestOrdersQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, customer:profiles!user_id(full_name)')
      .eq('store_id', storeId);

    if (startDate) latestOrdersQuery = latestOrdersQuery.gte('created_at', startDate);
    if (endDate) latestOrdersQuery = latestOrdersQuery.lte('created_at', endDate);

    const { data: latestOrders } = await latestOrdersQuery
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Top 5 Selling Products (within range)
    const orderIds = (orders || []).map(o => o.id);
    let topProducts = [];

    if (orderIds.length > 0) {
      const { data: topProductsData } = await supabaseAdmin
        .from('order_items')
        .select('product_id, name, quantity')
        .in('order_id', orderIds);

      const productSales = {};
      if (topProductsData) {
        topProductsData.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { id: item.product_id, name: item.name, total_qty: 0 };
          }
          productSales[item.product_id].total_qty += item.quantity;
        });
      }
      topProducts = Object.values(productSales)
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);
    }

    return successResponse(res, {
      store_id: storeId,
      applied_filters: { startDate, endDate },
      total_products: products ? products.length : 0,
      low_stock_alerts: lowStockCount,
      total_revenue: Number(totalRevenue.toFixed(2)),
      active_orders: activeOrders,
      total_orders: totalOrders,
      latest_orders: latestOrders || [],
      top_products: topProducts
    }, 'Dashboard stats updated');
  } catch (error) {
    console.error('[getDashboard] Error:', error);
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List products for the manager's store
 */
export const getInventory = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    console.log(`[Inventory] Fetching for manager ${req.user.id}, storeId: ${storeId}`);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, sub_category:sub_categories(name, category_id, category:categories(name)), variants:product_variants(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    console.log(`[Inventory] Found ${data?.length || 0} products`);
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
    const storeId = await resolveStoreId(req);

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
      .update({ 
        express_stock_qty: quantity,
        scheduled_stock_qty: quantity // Synchronize both by default for simple manager updates
      })
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
 * Toggle product active status
 */
export const updateProductStatus = async (req, res) => {
  const { productId } = req.params;
  const { is_active } = req.body;

  try {
    const storeId = await resolveStoreId(req);

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
      .update({ is_active })
      .eq('id', productId)
      .select()
      .single();

    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { product: data }, 'Product status updated');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get store profile
 */
export const getStoreProfile = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) return errorResponse(res, 'Failed to fetch store profile', 400, error);
    return successResponse(res, { store: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update store online status
 */
export const updateStoreStatus = async (req, res) => {
  const { is_active } = req.body;

  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { data, error } = await supabaseAdmin
      .from('stores')
      .update({ is_active })
      .eq('id', storeId)
      .select()
      .single();

    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { store: data }, 'Store status updated');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List orders for the manager's store
 */
export const getOrders = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);

    const { startDate, endDate, search, page = 1, pageSize = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(pageSize);
    const to = from + parseInt(pageSize) - 1;

    // 1. Fetch Orders and Customers (Direct join with profiles)
    let orderQuery = supabaseAdmin
      .from('orders')
      .select('*, customer:profiles!user_id(full_name, phone), delivery_address:addresses(*)', { count: 'exact' })
      .eq('store_id', storeId);

    if (startDate) orderQuery = orderQuery.gte('created_at', startDate);
    if (endDate) orderQuery = orderQuery.lte('created_at', endDate);
    if (search) orderQuery = orderQuery.or(`order_number.ilike.%${search}%,status.ilike.%${search}%`);

    const { data: orders, error: orderError, count } = await orderQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (orderError) return errorResponse(res, 'Failed to fetch orders', 400, orderError);
    if (!orders || orders.length === 0) return successResponse(res, { orders: [], total: 0 });

    // 2. Fetch Order Items separately to avoid join errors
    const orderIds = orders.map(o => o.id);
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*, product:products(image_url)')
      .in('order_id', orderIds);

    // 3. Manual stitching
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items ? items.filter(item => item.order_id === order.id) : []
    }));

    return successResponse(res, {
      orders: ordersWithItems,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List unique customers who have ordered from this store
 */
export const getCustomers = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('user_id, total_amount, created_at, customer:profiles!user_id(id, full_name, email, phone, avatar_url)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;

    if (error) return errorResponse(res, 'Failed to fetch customers', 400, error);

    const customerMap = {};
    data.forEach(order => {
      const cid = order.user_id;
      if (!cid) return; // Skip if no user_id (guest orders if any)

      if (!customerMap[cid]) {
        customerMap[cid] = {
          ...order.customer,
          total_orders: 0,
          total_spent: 0,
          last_order_at: order.created_at
        };
      }
      customerMap[cid].total_orders += 1;
      customerMap[cid].total_spent += Number(order.total_amount) || 0;
    });

    const customers = Object.values(customerMap).sort((a, b) => b.total_orders - a.total_orders);

    return successResponse(res, { customers });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const storeId = await resolveStoreId(req);
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('store_id, user_id, order_number')
      .eq('id', orderId)
      .single();

    if (!order || order.store_id !== storeId) return errorResponse(res, 'Access denied', 403);

    // Fetch current status for transition validation
    const { data: currentOrder } = await supabaseAdmin.from('orders').select('status, delivery_type').eq('id', orderId).single();
    
    try {
      validateTransition(currentOrder.status, status, 'store');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }

    // Handle Stock Deduction for Scheduled Orders at 'confirmed' status
    if (status === 'confirmed' && currentOrder.delivery_type !== 'express') {
      const { data: items } = await supabaseAdmin.from('order_items').select('product_id, quantity').eq('order_id', orderId);
      if (items) {
        for (const item of items) {
          const { data: product } = await supabaseAdmin.from('products').select('scheduled_stock_qty').eq('id', item.product_id).single();
          if (product) {
            const newStock = Math.max(0, (product.scheduled_stock_qty || 0) - item.quantity);
            await supabaseAdmin.from('products').update({ scheduled_stock_qty: newStock }).eq('id', item.product_id);
          }
        }
      }
    }

    const { data, error } = await supabaseAdmin.from('orders').update({ 
      status,
      status_updated_by: req.user.id,
      status_updated_role: 'store'
    }).eq('id', orderId).select().single();
    if (error) return errorResponse(res, 'Update failed', 400, error);

    // Send Notification to Customer
    try {
      let title = 'Order Update! 🛍️';
      let body = `Your order #${order.order_number} status is now ${status}.`;

      if (status === 'Accepted') {
        title = '👨‍🍳 Order Accepted';
        body = `Your order #${order.order_number} is being prepared!`;
      } else if (status === 'Out for Delivery') {
        title = '🛵 Out for Delivery';
        body = `Your order #${order.order_number} is on the way!`;
      } else if (status === 'Delivered') {
        title = '🍗 Order Delivered';
        body = `Enjoy your meal! Order #${order.order_number} has been delivered.`;
      } else if (status === 'Cancelled') {
        title = '😔 Order Cancelled';
        body = `We're sorry, your order #${order.order_number} has been cancelled by the store.`;
      }

      await notificationService.sendToUser(order.user_id, title, body, {
        type: 'order_update',
        status: status,
        orderId: orderId
      });

      // --- NEW: NOTIFY RIDERS WHEN READY ---
      if (status === 'ready') {
        const { data: storeInfo } = await supabaseAdmin
          .from('stores')
          .select('name, address')
          .eq('id', storeId)
          .single();
        
        const { data: orderDetails } = await supabaseAdmin
          .from('order_items')
          .select('name, quantity')
          .eq('order_id', orderId);

        const itemsSummary = orderDetails?.map(item => `${item.quantity}x ${item.name}`).join(', ') || 'Fresh items';
        
        if (order.order_number && storeInfo?.name) {
          notificationService.notifyAvailableRiders(
            orderId, 
            order.order_number, 
            storeInfo.name, 
            storeInfo.address, 
            itemsSummary
          );
        }
      }
    } catch (notifErr) {
      console.error('[Notification Error] Failed to notify customer/riders:', notifErr.message);
    }

    return successResponse(res, { order: data }, 'Order status updated');
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
    }

    // If no store found via GPS, or GPS not provided, try pincode
    if (!selected && pincode) {
      const pStr = pincode.toString();
      selected = stores.find(s => s.pincode === pStr) || null;

      if (!selected) {
        selected = stores.find(s =>
          s.serviceable_pincodes &&
          Array.isArray(s.serviceable_pincodes) &&
          s.serviceable_pincodes.includes(pStr)
        ) || null;
      }

      // If found via pincode and we have user coords, calculate distance
      if (selected && lat && lng) {
        const dist = haversine(parseFloat(lat), parseFloat(lng), parseFloat(selected.latitude), parseFloat(selected.longitude));
        selected = {
          ...selected,
          distance_km: dist
        };
        // Even if pincode matches, if distance is huge (> 25km), it's NOT serviceable
        if (dist > 25) {
          selected = null;
        }
      }
    }

    return successResponse(res, {
      store: selected,
      is_serviceable: !!selected,
      distance: selected && selected.distance_km ? selected.distance_km.toFixed(2) : null
    }, selected ? 'Nearest store found' : 'Location not serviceable');
  } catch (error) {
    return errorResponse(res, 'Failed to find nearest store', 500, error);
  }
};

/**
 * Create a new product for the store
 */
export const createProduct = async (req, res) => {
  try {
    console.log('[StoreController] createProduct request received');
    console.log('[Headers]', req.headers['content-type']);
    console.log('[Body Keys]', Object.keys(req.body));
    if (req.files) console.log('[Files Received]', req.files.length);
    
    // Find the main product image
    const mainFile = req.files?.find(f => f.fieldname === 'image');
    if (mainFile) console.log('[Main File]', mainFile.originalname);

    const storeId = await resolveStoreId(req);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { name } = req.body;
    if (!name) return errorResponse(res, 'Product name is required', 400);

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);

    const image_url = getImageUrl(mainFile, req.body.image_url);
    const variants = safeParseOptions(req.body.variants);
    const delivery_options = safeParseOptions(req.body.delivery_options, ['express', 'tomorrow_morning', 'tomorrow_evening']);

    const productData = {
      ...req.body,
      store_id: storeId,
      slug: req.body.slug || slug,
      image_url,
      price: parseFloat(req.body.price) || 0,
      discount_price: (req.body.discount_price && req.body.discount_price !== 'null') ? parseFloat(req.body.discount_price) : null,
      express_stock_qty: parseInt(req.body.express_stock_qty) || parseInt(req.body.stock_quantity) || 0,
      scheduled_stock_qty: parseInt(req.body.scheduled_stock_qty) || parseInt(req.body.stock_quantity) || 0,
      is_active: req.body.is_active === 'true' || req.body.is_active === true,
      delivery_options
    };

    // Remove UI-only fields and metadata that shouldn't be in the products table
    delete productData.category_id;
    delete productData.variants;

    const { data: product, error } = await supabaseAdmin.from('products').insert([productData]).select().single();

    if (error) return errorResponse(res, 'Failed to create product', 400, error);

    if (variants.length > 0) {
      await syncProductVariants(product.id, variants, req.files);
      const { data: refreshed } = await supabaseAdmin.from('products').select('*, variants:product_variants(*)').eq('id', product.id).single();
      return successResponse(res, { product: refreshed }, 'Product created with variants');
    }

    return successResponse(res, { product }, 'Product created');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update product details
 */
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`[StoreController] updateProduct called for ID: ${productId}`);
    console.log('[Headers]', req.headers['content-type']);
    console.log('[Body Keys]', Object.keys(req.body));
    if (req.files) console.log('[Files Received]', req.files.length);

    const mainFile = req.files?.find(f => f.fieldname === 'image');

    const storeId = await resolveStoreId(req);

    const { data: product } = await supabaseAdmin.from('products').select('store_id').eq('id', productId).single();
    if (!product || product.store_id !== storeId) {
      return errorResponse(res, 'Access denied: Product does not belong to your store', 403);
    }

    // Allowed fields for store manager updates
    const allowedFields = [
      'stock_quantity', 'price', 'discount_price', 'sale_price', 'description',
      'is_active', 'weight_unit', 'name', 'cooking_guide', 'image_url',
      'is_deal', 'is_featured', 'is_trending', 'is_flash_sale', 'sub_category_id',
      'delivery_options', 'express_stock_qty', 'scheduled_stock_qty'
    ];

    const image_url = getImageUrl(mainFile, req.body.image_url);

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'delivery_options') {
          updateData[key] = safeParseOptions(req.body[key]);
        } else if (['price', 'discount_price', 'sale_price', 'stock_quantity'].includes(key)) {
          updateData[key] = (req.body[key] && req.body[key] !== 'null') ? parseFloat(req.body[key]) : null;
        } else if (['is_active', 'is_deal', 'is_featured', 'is_trending', 'is_flash_sale'].includes(key)) {
          updateData[key] = req.body[key] === 'true' || req.body[key] === true;
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    if (image_url) {
      updateData.image_url = image_url;
    }

    const variants = safeParseOptions(req.body.variants, undefined);

    const { data: productData, error } = await supabaseAdmin.from('products').update(updateData).eq('id', productId).select().single();

    if (error) return errorResponse(res, 'Update failed', 400, error);

    if (variants !== undefined) {
      await syncProductVariants(productId, variants, req.files);
      const { data: refreshed } = await supabaseAdmin.from('products').select('*, variants:product_variants(*)').eq('id', productId).single();
      return successResponse(res, { product: refreshed }, 'Product and variants updated');
    }

    return successResponse(res, { product: productData }, 'Product updated');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Export Inventory as CSV
 */
export const exportInventoryCSV = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('name, sku, price, stock_quantity, is_active, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) throw error;

    let csv = 'Name,SKU,Price,Stock,Status,Added Date\n';
    data.forEach(p => {
      csv += `"${p.name}","${p.sku || ''}",${p.price},${p.stock_quantity},${p.is_active ? 'Active' : 'Inactive'},"${new Date(p.created_at).toLocaleDateString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    return res.status(200).send(csv);
  } catch (error) {
    return errorResponse(res, 'Export failed', 500, error);
  }
};

/**
 * Export Orders as CSV
 */
export const exportOrdersCSV = async (req, res) => {
  try {
    const storeId = await resolveStoreId(req);
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, payment_status, created_at, customer:profiles!user_id(full_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) throw error;

    let csv = 'Order ID,Customer,Amount,Status,Payment,Date\n';
    data.forEach(o => {
      csv += `"${o.id.slice(0, 8)}","${o.customer?.full_name || 'N/A'}",${o.total_amount},"${o.status}","${o.payment_status}","${new Date(o.created_at).toLocaleDateString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    return res.status(200).send(csv);
  } catch (error) {
    return errorResponse(res, 'Export failed', 500, error);
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const storeId = await resolveStoreId(req);

    const { data: product } = await supabaseAdmin.from('products').select('store_id').eq('id', productId).single();
    if (!product || product.store_id !== storeId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);

    if (error) {
      if (error.code === '23503') {
        return errorResponse(res, 'Cannot delete product as it has been ordered in the past. Please deactivate it instead.', 400, error);
      }
      return errorResponse(res, 'Deletion failed', 400, error);
    }
    return successResponse(res, null, 'Product deleted');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update FCM Token for push notifications
 */
export const updateFcmToken = async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return errorResponse(res, 'FCM token is required', 400);

  try {
    // 1. Remove this token from any other profiles to prevent duplicates
    await supabaseAdmin
      .from('profiles')
      .update({ fcm_token: null })
      .eq('fcm_token', fcm_token);

    // 2. Assign token to current user
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ fcm_token })
      .eq('id', req.user.id);

    if (error) throw error;
    return successResponse(res, null, 'FCM token updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update FCM token', 500, error);
  }
};

/**
 * Get all categories
 */
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return successResponse(res, { categories: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch categories', 500, error);
  }
};

/**
 * Get sub-categories for a category
 */
export const getSubCategories = async (req, res) => {
  const { categoryId } = req.query;
  try {
    let query = supabaseAdmin
      .from('sub_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, { sub_categories: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sub-categories', 500, error);
  }
};


