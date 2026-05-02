import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';
import { deleteFileByUrl } from '../utils/fileHelper.js';
import { successResponse, errorResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';
import { validateTransition } from '../utils/statusTransitions.js';

const getImageUrl = (file, bodyUrl, req = null, fieldname = 'image') => {
  // 1. Check direct file (upload.single)
  if (file) {
    const baseUrl = (process.env.CDN_BASE_URL || 'https://assets.dailyfreshkolkata.in/uploads').replace(/\/$/, '');
    return `${baseUrl}/${file.filename}`;
  }
  
  // 2. Check in files array (upload.any or upload.fields)
  if (req && req.files && Array.isArray(req.files)) {
    const foundFile = req.files.find(f => f.fieldname === fieldname);
    if (foundFile) {
      const baseUrl = (process.env.CDN_BASE_URL || 'https://assets.dailyfreshkolkata.in/uploads').replace(/\/$/, '');
      return `${baseUrl}/${foundFile.filename}`;
    }
  }

  return bodyUrl || null;
};

// Helper for parsing multi-select options (handles JSON or comma-separated strings)
const safeParseOptions = (options, defaultVal = []) => {
  if (!options) return defaultVal;
  if (Array.isArray(options)) return options;
  if (typeof options !== 'string') return defaultVal;
  
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    // Fallback: handle comma-separated strings (like "morning,express")
    return options.split(',').map(s => s.trim()).filter(s => s);
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const url = getImageUrl(req.file);
    return successResponse(res, { url }, 'File uploaded successfully');
  } catch (error) {
    return errorResponse(res, 'Upload failed', 500, error);
  }
};

/**
 * --- STORE MANAGEMENT ---
 */

export const createStore = async (req, res) => {
  const { name, manager_user_id, pincode, address, latitude, longitude, phone, email, delivery_radius_km, serviceable_pincodes } = req.body;
  if (!name) return errorResponse(res, 'Store name is required', 400);
  if (!pincode) return errorResponse(res, 'Primary PIN code is required', 400);

  try {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert([{
        name,
        manager_user_id: manager_user_id || null,
        pincode, address, latitude, longitude, phone, email,
        delivery_radius_km: delivery_radius_km || 10,
        serviceable_pincodes: serviceable_pincodes || [pincode]
      }])
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to create store', 400, error);
    return successResponse(res, { store: data }, 'Store created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const listStores = async (req, res) => {
  const { search } = req.query;
  try {
    let query = supabaseAdmin.from('stores').select('*, manager:profiles(full_name, email)');

    if (search) query = query.or(`name.ilike.%${search}%,pincode.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return errorResponse(res, 'Failed to fetch stores', 400, error);
    return successResponse(res, { stores: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const updateStore = async (req, res) => {
  const { id } = req.params;
  const { name, manager_user_id, pincode, address, latitude, longitude, phone, email, is_active, delivery_radius_km, serviceable_pincodes } = req.body;
  const updateData = {
    name,
    manager_user_id: manager_user_id === "" ? null : manager_user_id,
    pincode, address, latitude, longitude, phone, email, is_active,
    delivery_radius_km,
    serviceable_pincodes
  };

  // Remove undefined to prevent Supabase from trying to update to null unless intended
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabaseAdmin.from('stores').update(updateData).eq('id', id).select().single();
    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { store: data }, 'Store updated');
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

export const deleteStore = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get store details (for images and manager ID)
    const { data: store, error: fetchError } = await supabaseAdmin
      .from('stores')
      .select('manager_user_id, logo_url, cover_url')
      .eq('id', id)
      .single();

    if (fetchError) return errorResponse(res, 'Store not found', 404);

    // 2. Check for orders (Safety)
    const { count: orderCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', id);

    if (orderCount > 0) {
      return errorResponse(res, 'Cannot delete store with existing orders. Please "Deactivate" it instead.', 400);
    }

    // 3. Smart Manager Deletion: Check if this is the only store they manage
    let managerDeleted = false;
    if (store.manager_user_id) {
      const { count: storeCount } = await supabaseAdmin
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('manager_user_id', store.manager_user_id);

      // If they only manage this 1 store, delete the account entirely
      if (storeCount === 1) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(store.manager_user_id);
        if (authError) console.error('[Cleanup] Manager auth delete failed:', authError.message);
        else managerDeleted = true;
      }
    }

    // 4. If manager was not deleted (multiple stores), delete only the store record
    if (!managerDeleted) {
      const { error: deleteError } = await supabaseAdmin.from('stores').delete().eq('id', id);
      if (deleteError) throw deleteError;
    }

    // 5. Always cleanup VPS images
    deleteFileByUrl(store.logo_url);
    deleteFileByUrl(store.cover_url);

    return successResponse(res, null, managerDeleted ? 'Store and unique Manager deleted successfully' : 'Store deleted successfully (Manager remains for other stores)');
  } catch (error) {
    console.error('Delete Store Error:', error);
    return errorResponse(res, 'Delete failed', 500, error);
  }
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch profile and related info for cleanup
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*, riders(govt_id_url, license_url)')
      .eq('id', id)
      .single();

    if (fetchError) return errorResponse(res, 'Staff member not found', 404);
    if (profile.role === 'admin') return errorResponse(res, 'Cannot delete admin accounts', 403);

    // 2. Delete Auth User (Cascades to profile, riders, etc.)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) return errorResponse(res, 'Auth delete failed', 400, authError);

    // 3. Cleanup Files
    deleteFileByUrl(profile.avatar_url);
    if (profile.riders?.[0]) {
      deleteFileByUrl(profile.riders[0].govt_id_url);
      deleteFileByUrl(profile.riders[0].license_url);
    }

    return successResponse(res, null, 'Staff deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Delete failed', 500, error);
  }
};

/**
 * --- RIDER MANAGEMENT ---
 */

export const updateRiderStatus = async (req, res) => {
  const { riderId } = req.params;
  const { is_online, approval_status } = req.body;
  const updates = {};
  if (is_online !== undefined) updates.is_online = is_online;
  if (approval_status !== undefined) updates.approval_status = approval_status;

  try {
    const { data, error } = await supabaseAdmin
      .from('riders')
      .update(updates)
      .eq('id', riderId)
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to update rider', 400, error);
    return successResponse(res, { rider: data }, 'Rider updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const approveRider = async (req, res) => {
  const { riderId } = req.params;
  const { status } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('riders')
      .update({ approval_status: status })
      .eq('id', riderId)
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to update rider status', 400, error);
    return successResponse(res, { rider: data }, `Rider ${status} successfully`);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const listRiders = async (req, res) => {
  const { page = 1, pageSize = 50, search } = req.query;
  const storeIdToFetch = req.user.role === 'store_manager' ? req.user.store_id : req.query.store_id;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('riders')
      .select('*, user:profiles(*), store:stores(name)', { count: 'exact' });

    if (storeIdToFetch) {
      query = query.eq('assigned_store_id', storeIdToFetch);
    }

    if (search) {
      query = query.or(`vehicle_type.ilike.%${search}%,vehicle_number.ilike.%${search}%`);
      // Note: searching in joined profiles requires a separate approach or DB views in Supabase.
      // For now, we prioritize the store filter as requested by the user.
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;
    return successResponse(res, { riders: data, pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch riders', 500, error);
  }
};

/**
 * --- DASHBOARD & ANALYTICS ---
 */

export const getDashboardStats = async (req, res) => {
  const { startDate, endDate } = req.query;
  const storeIdToFetch = req.user.role === 'store_manager' ? req.user.store_id : req.query.store_id;

  try {
    // 1. Core Metrics (Revenue, AOV, Cancelled)
    const ordersQuery = supabaseAdmin.from('orders').select('total_amount, status, payment_status, created_at, store_id');
    if (storeIdToFetch) ordersQuery.eq('store_id', storeIdToFetch);
    if (startDate) ordersQuery.gte('created_at', startDate);
    if (endDate) ordersQuery.lte('created_at', `${endDate} 23:59:59`);

    const { data: ordersData } = await ordersQuery;

    const paidOrders = ordersData?.filter(o => o.payment_status === 'paid') || [];
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const aov = paidOrders.length > 0 ? (revenue / paidOrders.length).toFixed(2) : 0;
    const cancelledCount = ordersData?.filter(o => o.status === 'cancelled').length || 0;
    const totalOrders = ordersData?.length || 0;

    // 2. Customers (Super Admin Only)
    let customerCount = 0;
    if (!storeIdToFetch) {
      const custQuery = supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer');
      if (startDate) custQuery.gte('created_at', startDate);
      if (endDate) custQuery.lte('created_at', `${endDate} 23:59:59`);
      const { count } = await custQuery;
      customerCount = count || 0;
    }

    // 3. Riders (Active vs Total)
    const riderQuery = supabaseAdmin.from('riders').select('is_online');
    if (storeIdToFetch) riderQuery.eq('assigned_store_id', storeIdToFetch);
    const { data: ridersData } = await riderQuery;
    const activeRiders = ridersData?.filter(r => r.is_online).length || 0;
    const totalRiders = ridersData?.length || 0;

    // 4. Low Stock Products
    const lowStockQuery = supabaseAdmin
      .from('products')
      .select('name, stock_quantity, weight_unit, store:stores(name)')
      .lt('stock_quantity', 10);
    if (storeIdToFetch) lowStockQuery.eq('store_id', storeIdToFetch);
    const { data: lowStockProducts } = await lowStockQuery.limit(5);

    // 5. Live Orders (Last 5)
    const liveOrdersQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, customer:profiles(full_name), store:stores(name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (storeIdToFetch) liveOrdersQuery.eq('store_id', storeIdToFetch);
    const { data: liveOrders } = await liveOrdersQuery;

    // 6. Top Stores (Admin Only)
    let topStores = [];
    if (!storeIdToFetch) {
      const storeMap = {};
      paidOrders.forEach(o => {
        storeMap[o.store_id] = (storeMap[o.store_id] || 0) + Number(o.total_amount);
      });
    }

    return successResponse(res, {
      stats: {
        revenue,
        aov,
        cancelled_orders: cancelledCount,
        orders: totalOrders,
        customers: customerCount || 0,
        active_riders: activeRiders,
        total_riders: totalRiders
      },
      live_orders: liveOrders || [],
      low_stock: lowStockProducts || [],
      top_performing: {
        // We will implement these based on real data or analytics tables if needed
        products: [],
        stores: []
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return errorResponse(res, 'Failed to fetch dashboard stats', 500, error);
  }
};

/**
 * --- ORDER MANAGEMENT ---
 */

export const listOrders = async (req, res) => {
  const { page = 1, pageSize = 50, status, startDate, endDate, search, user_id } = req.query;
  const storeIdToFetch = req.user.role === 'store_manager' ? req.user.store_id : req.query.store_id;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('orders')
      .select('*, customer:profiles!user_id(full_name, email), rider:profiles!rider_id(full_name, phone), store:stores(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', `${endDate} 23:59:59`);

    query = query.range(from, to);

    if (status && status !== 'all') query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);
    if (req.user.role === 'store_manager') {
      query = query.eq('store_id', req.user.store_id);
    } else if (req.query.store_id) {
      query = query.eq('store_id', req.query.store_id);
    }

    if (search) {
      // 1. Check if it's an order number (e.g., RN-...)
      if (search.toUpperCase().startsWith('RN-')) {
        query = query.ilike('order_number', `%${search}%`);
      } else {
        // 2. Otherwise, assume it's a customer name/email search
        // Find matching profiles first
        const { data: matchedProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        
        if (matchedProfiles && matchedProfiles.length > 0) {
          const profileIds = matchedProfiles.map(p => p.id);
          query = query.in('user_id', profileIds);
        } else {
          // If no profiles match, search order_number as fallback
          query = query.ilike('order_number', `%${search}%`);
        }
      }
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return successResponse(res, {
      orders: data,
      pagination: { total: count, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch orders', 500, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rider_id } = req.body;
  const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

  if (!validStatuses.includes(status)) {
    return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  try {
    // Fetch current status for transition validation
    const { data: currentOrder } = await supabaseAdmin.from('orders').select('status, delivery_type').eq('id', id).single();
    
    try {
      validateTransition(currentOrder.status, status, 'admin');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }

    const updates = { 
      status, 
      status_updated_at: new Date(),
      status_updated_by: req.user.id,
      status_updated_role: 'admin'
    };
    if (rider_id) updates.rider_id = rider_id;

    // Handle Stock Deduction for Scheduled Orders at 'confirmed' status (if not already done)
    if (status === 'confirmed' && currentOrder.delivery_type !== 'express') {
      const { data: items } = await supabaseAdmin.from('order_items').select('product_id, quantity').eq('order_id', id);
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

    // RBAC: Store Managers can only update their own store's orders
    let query = supabaseAdmin.from('orders').update(updates).eq('id', id);
    if (req.user.role === 'store_manager') {
      query = query.eq('store_id', req.user.store_id);
    }

    const { data: order, error: updateError } = await query.select('*, customer:profiles!user_id(full_name, email)').single();

    if (updateError) return errorResponse(res, 'Failed to update order status or access denied', 400, updateError);

    // Note: status change is automatically logged via Supabase trigger created in the SQL migration

    // --- PUSH NOTIFICATIONS ---
    let title = '';
    let body = '';
    
    switch (status) {
      case 'confirmed':
      case 'accepted':
        title = 'Order Confirmed! ✅';
        body = 'Your order has been accepted and will be prepared shortly.';
        break;
      case 'preparing':
        title = 'Preparing Your Order 🥣';
        body = 'We are now preparing your fresh items.';
        break;
      case 'ready':
        title = 'Order Ready! 📦';
        body = 'Your order is packed and ready for pickup.';
        break;
      case 'out_for_delivery':
      case 'dispatched':
        title = 'Order Dispatched! 🚚';
        body = 'Your order has been picked up and is on the way.';
        break;
      case 'delivered':
        title = 'Order Delivered! 🎉';
        body = 'Your order has been delivered. Enjoy!';
        break;
      case 'cancelled':
        title = 'Order Cancelled ❌';
        body = 'Your order has been cancelled.';
        break;
      default:
        title = 'Order Update';
        body = `Your order status has been updated to ${status}.`;
    }

    if (title && order?.user_id) {
      console.log(`[Admin] Sending status update notification to user ${order.user_id} for status: ${status}`);
      await notificationService.sendToUser(order.user_id, title, body, { 
        type: 'order_status_update', 
        status: status, 
        order_id: id 
      });
    } else {
      console.warn(`[Admin] Could not send notification. Title: ${title}, UserID: ${order?.user_id}`);
    }

    return successResponse(res, { order }, `Order status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * --- USER MANAGEMENT ---
 */

export const listCustomers = async (req, res) => {
  const { page = 1, pageSize = 50, search } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);
    
    if (error) throw error;
    return successResponse(res, { 
      customers: data, 
      pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (error) {
    console.error('List Customers Error:', error);
    return errorResponse(res, 'Failed to fetch customers', 500, error);
  }
};

export const listStaff = async (req, res) => {
  const { role = 'store_manager', search } = req.query;
  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, { staff: data });
  } catch (error) {
    console.error('List Staff Error:', error);
    return errorResponse(res, 'Failed to fetch staff', 500, error);
  }
};

/**
 * --- CATALOGUE MANAGEMENT ---
 */

// Lists
export const listCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return successResponse(res, { categories: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch categories', 500, error);
  }
};

export const listSubCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sub_categories')
      .select('*, category:categories(name)')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return successResponse(res, { sub_categories: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sub-categories', 500, error);
  }
};

export const listProducts = async (req, res) => {
  const { page = 1, pageSize = 50, search } = req.query;
  const storeIdToFetch = req.user.role === 'store_manager' ? req.user.store_id : req.query.store_id;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('products')
      .select('*, store:stores(name), sub_category:sub_categories(name, category:categories(name)), variants:product_variants(*)', { count: 'exact' });

    if (storeIdToFetch) query = query.eq('store_id', storeIdToFetch);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    return successResponse(res, {
      products: data,
      pagination: { total: count, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch products', 500, error);
  }
};

// Create
export const createCategory = async (req, res) => {
  const { name, slug, description, display_order, image_url: bodyUrl } = req.body;
  if (!name) return errorResponse(res, 'Category name is required', 400);
  if (!slug) return errorResponse(res, 'Slug is required', 400);

  const image_url = getImageUrl(req.file, bodyUrl, req);

  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name, slug, description, image_url, display_order }])
      .select()
      .single();
    if (error) return errorResponse(res, 'Failed to create category', 400, error);
    return successResponse(res, { category: data }, 'Category created', 201);
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

export const createSubCategory = async (req, res) => {
  const { category_id, name, slug, description, display_order, image_url: bodyUrl } = req.body;
  if (!category_id) return errorResponse(res, 'Parent category is required', 400);
  if (!name) return errorResponse(res, 'Sub-category name is required', 400);

  const image_url = getImageUrl(req.file, bodyUrl, req);

  try {
    const { data, error } = await supabaseAdmin.from('sub_categories').insert([{
      category_id: category_id || null,
      name, slug, description, image_url, display_order
    }]).select().single();
    if (error) return errorResponse(res, 'Failed to create sub-category', 400, error);
    return successResponse(res, { sub_category: data }, 'Sub-category created', 201);
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

export const createProduct = async (req, res) => {
  let { store_id, sub_category_id, name, slug, price, weight_unit, stock_quantity, description, cooking_guide, product_highlights, image_url: bodyUrl } = req.body;

  // If Store Manager, force their assigned store ID
  if (req.user.role === 'store_manager') {
    store_id = req.user.store_id;
  }

  // Sanitize store_id (prevent "undefined" string from frontend or logic)
  if (store_id === 'undefined' || store_id === '') store_id = null;

  if (!store_id) return errorResponse(res, 'Access Denied: You must be assigned to a store to manage products.', 403);
  if (!sub_category_id) return errorResponse(res, 'Please select a sub-category.', 400);
  if (!name) return errorResponse(res, 'Product name is required.', 400);
  if (price === undefined || price === null) return errorResponse(res, 'Price is required.', 400);

  const image_url = getImageUrl(req.file, bodyUrl, req);

  try {
    const productData = {
      store_id: store_id || null,
      sub_category_id: sub_category_id || null,
      name, slug, price, weight_unit, 
      express_stock_qty: parseInt(req.body.express_stock_qty) || parseInt(req.body.stock_quantity) || 0,
      scheduled_stock_qty: parseInt(req.body.scheduled_stock_qty) || parseInt(req.body.stock_quantity) || 0,
      image_url, description,
      cooking_guide,
      product_highlights: (() => {
        if (!product_highlights) return [];
        if (typeof product_highlights === 'object') return product_highlights;
        if (product_highlights === '[object Object]') return [];
        try {
          return JSON.parse(product_highlights);
        } catch (e) {
          console.warn('[Admin] Failed to parse product_highlights JSON:', e.message);
          return [];
        }
      })(),
      is_deal: req.body.is_deal === 'true' || req.body.is_deal === true,
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
      is_flash_sale: req.body.is_flash_sale === 'true' || req.body.is_flash_sale === true,
      is_exclusive: req.body.is_exclusive === 'true' || req.body.is_exclusive === true,
      is_trending: req.body.is_trending === 'true' || req.body.is_trending === true,
      is_frozen: req.body.is_frozen === 'true' || req.body.is_frozen === true,
      is_new_launch: req.body.is_new_launch === 'true' || req.body.is_new_launch === true,
      delivery_options: safeParseOptions(req.body.delivery_options, ['morning', 'afternoon', 'express'])
    };

    const { data: product, error } = await supabaseAdmin.from('products').insert([productData]).select('*, variants:product_variants(*)').single();
    if (error) return errorResponse(res, 'Failed to create product', 400, error);

    // --- HANDLE VARIANTS ---
    const variants = req.body.variants ? (typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants) : [];
    if (variants.length > 0) {
      try {
        console.log(`[Admin] Creating ${variants.length} variants for product ${product.id}`);
        await syncProductVariants(product.id, variants, req);
        
        // Refresh product with inserted variants
        const { data: refreshed } = await supabaseAdmin.from('products').select('*, variants:product_variants(*)').eq('id', product.id).single();
        return successResponse(res, { product: refreshed }, 'Product created', 201);
      } catch (variantErr) {
        // Since product was created, we might want to delete it or inform the user
        // For now, let's just return the error. The admin can try to edit it later.
        return errorResponse(res, `Product created but variants failed: ${variantErr.message}`, 400);
      }
    }

    return successResponse(res, { product }, 'Product created', 201);
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

// Helper for variants
const syncProductVariants = async (productId, variants, req = null) => {
  if (!Array.isArray(variants)) return;
  console.log(`[Admin] Syncing ${variants.length} variants for product ${productId}`);

  try {
    // 1. Get existing variant IDs
    const { data: existing } = await supabaseAdmin.from('product_variants').select('id').eq('product_id', productId);
    const existingIds = (existing || []).map(v => v.id);
    
    // 2. Identify variants to delete (those not in the incoming list)
    const incomingIds = variants.map(v => v.id).filter(id => id);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    if (idsToDelete.length > 0) {
      console.log(`[Admin] Deleting ${idsToDelete.length} obsolete variants`);
      await supabaseAdmin.from('product_variants').delete().in('id', idsToDelete);
    }

    // 3. Helper and ID generation
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const generateUUID = () => crypto.randomUUID();

    // 4. Prepare all variants for upsert
    const variantsToUpsert = variants.map((v, index) => {
      // Look for uploaded file for this specific variant
      const variantImageUrl = getImageUrl(null, v.image_url, req, `variant_image_${index}`);

      const record = {
        product_id: productId,
        name: v.name,
        description: v.description || null,
        price: parseFloat(v.price) || 0,
        discount_price: (v.discount_price && v.discount_price !== '' && v.discount_price !== 'null') ? parseFloat(v.discount_price) : null,
        weight_text: v.weight_text || null,
        gross_weight_text: v.gross_weight_text || null,
        image_url: variantImageUrl,
        delivery_info: (v.delivery_info && Array.isArray(v.delivery_info)) ? v.delivery_info : (v.delivery_info ? [v.delivery_info] : ['Tomorrow Morning']),
        display_order: v.display_order || 0
      };

      // If it's an existing variant, keep its ID; otherwise, generate a new one
      if (v.id && isUUID(v.id)) {
        record.id = v.id;
      } else {
        record.id = generateUUID();
      }
      
      return record;
    });

    // 5. Validate all variants
    if (variantsToUpsert.length > 0) {
      const invalid = variantsToUpsert.find(v => !v.name || v.price <= 0);
      if (invalid) {
        throw new Error('All variants must have a name and a valid price (> 0)');
      }

      console.log(`[Admin] Syncing ${variantsToUpsert.length} variants for product ${productId}`);
      
      // 6. Single bulk upsert (now safe because all records have IDs)
      const { error: upsertError } = await supabaseAdmin
        .from('product_variants')
        .upsert(variantsToUpsert, { onConflict: 'id' });

      if (upsertError) {
        console.error('[Admin] Bulk upsert variants error:', upsertError);
        throw upsertError;
      }
    }
  } catch (error) {
    console.error('[Admin] Variant sync error:', error);
    throw error;
  }
};

// Update
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image_url: bodyUrl, display_order, is_active } = req.body;
  const updateData = { name, slug, description, display_order, is_active };

  if (req.file || req.files) updateData.image_url = getImageUrl(req.file, bodyUrl, req);
  else if (bodyUrl !== undefined) updateData.image_url = bodyUrl;

  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabaseAdmin.from('categories').update(updateData).eq('id', id).select().single();
    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { category: data }, 'Category updated');
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

export const updateSubCategory = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, slug, description, image_url: bodyUrl, display_order, is_active } = req.body;
  const updateData = {
    category_id: category_id === "" ? null : category_id,
    name, slug, description, display_order, is_active
  };

  if (req.file || req.files) updateData.image_url = getImageUrl(req.file, bodyUrl, req);
  else if (bodyUrl !== undefined) updateData.image_url = bodyUrl;

  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabaseAdmin.from('sub_categories').update(updateData).eq('id', id).select().single();
    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { sub_category: data }, 'Sub-category updated');
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { store_id, sub_category_id, name, slug, description, cooking_guide, product_highlights, image_url: bodyUrl, price, discount_price, weight_unit, stock_quantity, is_active, is_deal, is_featured } = req.body;
  
  // Sanitize UUID inputs
  const clean_store_id = (store_id === 'undefined' || store_id === '') ? null : store_id;
  const clean_sub_cat_id = (sub_category_id === 'undefined' || sub_category_id === '') ? null : sub_category_id;

  const updateData = { 
    store_id: clean_store_id, 
    sub_category_id: clean_sub_cat_id, 
    name, 
    slug, 
    description, 
    price, 
    discount_price, 
    weight_unit, 
    express_stock_qty: req.body.express_stock_qty || req.body.stock_quantity,
    scheduled_stock_qty: req.body.scheduled_stock_qty || req.body.stock_quantity,
    is_active, 
    is_deal, 
    cooking_guide,
    product_highlights: (() => {
      if (!product_highlights) return undefined;
      if (typeof product_highlights === 'object') return product_highlights;
      if (product_highlights === '[object Object]') return [];
      try {
        return JSON.parse(product_highlights);
      } catch (e) {
        console.warn('[Admin] Failed to parse product_highlights JSON:', e.message);
        return [];
      }
    })(),
    is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
    is_flash_sale: req.body.is_flash_sale === 'true' || req.body.is_flash_sale === true,
    is_exclusive: req.body.is_exclusive === 'true' || req.body.is_exclusive === true,
    is_trending: req.body.is_trending === 'true' || req.body.is_trending === true,
    is_frozen: req.body.is_frozen === 'true' || req.body.is_frozen === true,
    is_new_launch: req.body.is_new_launch === 'true' || req.body.is_new_launch === true,
    delivery_options: req.body.delivery_options ? safeParseOptions(req.body.delivery_options, ['morning', 'afternoon', 'express']) : undefined
  };

  if (req.file || req.files) updateData.image_url = getImageUrl(req.file, bodyUrl, req);
  else if (bodyUrl !== undefined) updateData.image_url = bodyUrl;

  // RBAC: Store Managers can only update specific fields (Catalog details like Name/SubCat are usually Admin-only)
    if (req.user.role === 'store_manager') {
      const fieldsToKeep = [
        'stock_quantity', 'express_stock_qty', 'scheduled_stock_qty', 'price', 'discount_price', 'is_active', 'image_url',
        'is_deal', 'is_featured', 'is_flash_sale', 'is_exclusive', 'is_trending', 'is_frozen', 'is_new_launch', 'delivery_options'
      ];
    Object.keys(updateData).forEach(key => {
      if (!fieldsToKeep.includes(key)) delete updateData[key];
    });
  } else {
    // Standard cleanup for Admin
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
  }

  // Ensure boolean flags are correctly parsed from potential string inputs (FormData)
  ['is_deal', 'is_featured', 'is_flash_sale', 'is_exclusive', 'is_trending', 'is_frozen', 'is_new_launch', 'is_active'].forEach(flag => {
    if (updateData[flag] !== undefined) {
      updateData[flag] = updateData[flag] === 'true' || updateData[flag] === true;
    }
  });

  try {
    let query = supabaseAdmin.from('products').update(updateData).eq('id', id);
    
    // RBAC: Store Managers can only update their own store's products
    if (req.user.role === 'store_manager') {
      if (!req.user.store_id) return errorResponse(res, 'Access Denied: You are not assigned to a store.', 403);
      query = query.eq('store_id', req.user.store_id);
    }

    // --- SYNC VARIANTS ---
    if (req.body.variants) {
      try {
        const variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        await syncProductVariants(id, variants, req);
      } catch (variantErr) {
        return errorResponse(res, variantErr.message || 'Failed to sync variants', 400);
      }
    }

    const { data: product, error } = await query.select('*, variants:product_variants(*)').single();
    if (error) return errorResponse(res, 'Update failed or access denied', 400, error);

    return successResponse(res, { product }, 'Product updated');
  } catch (error) { return errorResponse(res, 'Error', 500, error); }
};

// Delete
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch for cleanup
    const { data: category, error: fetchError } = await supabaseAdmin.from('categories').select('image_url').eq('id', id).single();
    if (fetchError) return errorResponse(res, 'Category not found', 404);

    const { count } = await supabaseAdmin.from('sub_categories').select('*', { count: 'exact', head: true }).eq('category_id', id);
    if (count > 0) return errorResponse(res, 'Cannot delete category with active sub-categories', 400);

    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') return errorResponse(res, 'Category is still linked to products.', 400);
      throw error;
    }

    // 2. Cleanup file
    deleteFileByUrl(category.image_url);

    return successResponse(res, null, 'Category deleted');
  } catch (error) { 
    return errorResponse(res, 'Delete failed', 500, error); 
  }
};

export const deleteSubCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: subcat, error: fetchError } = await supabaseAdmin.from('sub_categories').select('image_url').eq('id', id).single();
    if (fetchError) return errorResponse(res, 'Sub-category not found', 404);

    const { count } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('sub_category_id', id);
    if (count > 0) return errorResponse(res, 'Cannot delete sub-category with active products', 400);

    const { error } = await supabaseAdmin.from('sub_categories').delete().eq('id', id);
    if (error) throw error;

    deleteFileByUrl(subcat.image_url);

    return successResponse(res, null, 'Sub-category deleted');
  } catch (error) { return errorResponse(res, 'Delete failed', 500, error); }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: product, error: fetchError } = await supabaseAdmin.from('products').select('image_url').eq('id', id).single();
    if (fetchError) return errorResponse(res, 'Product not found', 404);

    let query = supabaseAdmin.from('products').delete().eq('id', id);
    if (req.user.role === 'store_manager') query = query.eq('store_id', req.user.store_id);

    const { error } = await query;
    if (error) {
      if (error.code === '23503') return errorResponse(res, 'Cannot delete product with existing orders. Deactivate it instead.', 400);
      throw error;
    }

    deleteFileByUrl(product.image_url);

    return successResponse(res, null, 'Product deleted');
  } catch (error) { return errorResponse(res, 'Delete failed', 500, error); }
};

/**
 * --- ONBOARDING ---
 */

export const onboardStaff = async (req, res) => {
  const { email, password, full_name, phone, role, store_id, vehicle_type, vehicle_number } = req.body;

  if (!email || !password || !full_name || !role) {
    return errorResponse(res, 'Missing required onboarding data', 400);
  }

  try {
    // 1. Create Auth User via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      let msg = 'Staff registration failed';
      if (authError.message.includes('already been registered')) msg = 'An account with this email/ID already exists.';
      if (authError.message.includes('password')) msg = 'Initial password is too weak.';
      return errorResponse(res, msg, 400, authError);
    }

    const userId = authData.user.id;

    // 2. Profile creation (using upsert to prevent trigger conflicts)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{ id: userId, full_name, phone, role, email }], { onConflict: 'id' });

    if (profileError) {
      // Cleanup: Delete auth user if profile fails? (Optional but recommended)
      await supabaseAdmin.auth.admin.deleteUser(userId);
      let msg = 'Profile creation failed';
      if (profileError.message.includes('phone')) msg = 'This phone number is already linked to another account.';
      return errorResponse(res, msg, 400, profileError);
    }

    // 3. If Rider, create rider record
    if (role === 'rider') {
      const { error: riderError } = await supabaseAdmin
        .from('riders')
        .insert([{
          user_id: userId,
          assigned_store_id: store_id || null,
          vehicle_type,
          vehicle_number,
          approval_status: 'approved'
        }]);

      if (riderError) return errorResponse(res, 'Rider record creation failed', 400, riderError);
    }

    return successResponse(res, { user_id: userId }, `Staff (${role}) onboarded successfully`, 201);
  } catch (error) {
    return errorResponse(res, 'Onboarding error', 500, error);
  }
};

/**
 * --- PLATFORM SETTINGS ---
 */

export const getPlatformSettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*');

    if (error) return errorResponse(res, 'Failed to fetch settings', 400, error);

    // Convert key-value array to a flat object
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.data_type === 'number' ? Number(s.value) : s.value;
    });

    // Map internal keys to frontend expected keys if different
    const mappedConfig = {
      gst_rate: config.gst_rate,
      free_delivery_threshold: config.free_delivery_above,
      standard_delivery_fee: config.default_delivery_charge,
      min_order_value: config.min_order_value,
      contact_support_phone: config.contact_support_phone || '',
      contact_support_email: config.contact_support_email || '',
      delivery_slots_config: config.delivery_slots_config ? (typeof config.delivery_slots_config === 'string' ? config.delivery_slots_config : JSON.stringify(config.delivery_slots_config)) : null
    };

    return successResponse(res, { settings: mappedConfig });
  } catch (error) {
    return errorResponse(res, 'Error', 500, error);
  }
};

export const updatePlatformSettings = async (req, res) => {
  const updates = req.body;

  // Map frontend keys back to DB keys
  const dbUpdates = [
    { key: 'gst_rate', value: String(updates.gst_rate) },
    { key: 'free_delivery_above', value: String(updates.free_delivery_threshold) },
    { key: 'default_delivery_charge', value: String(updates.standard_delivery_fee) },
    { key: 'min_order_value', value: String(updates.min_order_value) }
  ];

  if (updates.contact_support_phone) dbUpdates.push({ key: 'contact_support_phone', value: updates.contact_support_phone });
  if (updates.contact_support_email) dbUpdates.push({ key: 'contact_support_email', value: updates.contact_support_email });
  if (updates.delivery_slots_config) dbUpdates.push({ key: 'delivery_slots_config', value: typeof updates.delivery_slots_config === 'string' ? updates.delivery_slots_config : JSON.stringify(updates.delivery_slots_config), data_type: 'json' });

  try {
    const results = await Promise.all(dbUpdates.map(u =>
      supabaseAdmin.from('settings').upsert({ 
        key: u.key, 
        value: u.value,
        data_type: u.data_type || 'string' 
      }, { onConflict: 'key' })
    ));

    const errors = results.filter(r => r.error);
    if (errors.length > 0) return errorResponse(res, 'Some updates failed', 400, errors[0].error);

    return successResponse(res, null, 'Settings updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error', 500, error);
  }
};

/**
 * --- HOME SCREEN & BANNER MANAGEMENT ---
 */

export const listBanners = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation "banners" does not exist')) {
        console.warn('[Supabase] banners table missing. Please run migrations.');
        return successResponse(res, { banners: [] }, 'Table not found, please run migrations');
      }
      throw error;
    }
    return successResponse(res, { banners: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch banners', 500, error);
  }
};

export const createBanner = async (req, res) => {
  const { title, image_url: bodyUrl, link_url, placement, display_order, is_active } = req.body;
  const image_url = getImageUrl(req.file, bodyUrl, req);

  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert([{ title, image_url, link_url, placement, display_order, is_active }])
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, { banner: data }, 'Banner created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create banner', 500, error);
  }
};

export const updateBanner = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (req.file || req.files) updateData.image_url = getImageUrl(req.file, bodyUrl, req);
  delete updateData.imageFile; // Remove frontend-only field

  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, { banner: data }, 'Banner updated');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500, error);
  }
};

export const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: banner, error: fetchError } = await supabaseAdmin.from('banners').select('image_url').eq('id', id).single();
    if (fetchError) return errorResponse(res, 'Banner not found', 404);

    const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);
    if (error) throw error;

    deleteFileByUrl(banner.image_url);

    return successResponse(res, null, 'Banner deleted');
  } catch (error) {
    return errorResponse(res, 'Delete failed', 500, error);
  }
};

export const listHomeSections = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('home_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return empty array instead of 500
      if (error.code === 'PGRST116' || error.message?.includes('relation "home_sections" does not exist')) {
        console.warn('[Supabase] home_sections table missing. Please run migrations.');
        return successResponse(res, { sections: [] }, 'Table not found, please run migrations');
      }
      throw error;
    }
    return successResponse(res, { sections: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch sections', 500, error);
  }
};

export const updateHomeSection = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, display_order, is_active, config } = req.body;

  try {
    const sectionConfig = (() => {
      if (!config) return undefined;
      if (typeof config === 'object') return config;
      try {
        return JSON.parse(config);
      } catch (e) {
        return undefined;
      }
    })();

    const { data, error } = await supabaseAdmin
      .from('home_sections')
      .update({ title, subtitle, display_order, is_active, config: sectionConfig })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, { section: data }, 'Section updated');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500, error);
  }
};

