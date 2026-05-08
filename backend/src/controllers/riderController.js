import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';
import { validateTransition } from '../utils/statusTransitions.js';

/**
 * Get Rider Profile & Assigned Store
 */
export const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('riders')
      .select('*, store:stores(name, address)')
      .eq('user_id', req.user.id)
      .single();

    if (error) return errorResponse(res, 'Rider profile not found', 404, error);
    return successResponse(res, { rider: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update FCM Token for Notifications
 */
export const updateFCMToken = async (req, res) => {
  const { fcm_token } = req.body;
  try {
    // Update profiles table (used by notificationService)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ fcm_token })
      .eq('id', req.user.id);

    if (profileError) return errorResponse(res, 'Failed to update profile FCM token', 400, profileError);

    // Update riders table (for redundancy/rider specific logic)
    const { error: riderError } = await supabaseAdmin
      .from('riders')
      .update({ fcm_token })
      .eq('user_id', req.user.id);

    if (riderError) return errorResponse(res, 'Failed to update rider FCM token', 400, riderError);

    return successResponse(res, {}, 'FCM token updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Toggle Online/Offline Status
 */
export const toggleOnline = async (req, res) => {
  const { is_online } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('riders')
      .update({ is_online })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to update status', 400, error);
    return successResponse(res, { rider: data }, `Rider is now ${is_online ? 'Online' : 'Offline'}`);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update Live GPS Location
 */
export const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    const { error: riderError } = await supabaseAdmin
      .from('riders')
      .update({ current_lat: latitude, current_lng: longitude, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    if (riderError) return errorResponse(res, 'Failed to update rider table', 400, riderError);

    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id, user_id')
      .eq('user_id', req.user.id)
      .single();

    if (rider) {
      await supabaseAdmin.rpc('update_rider_location', {
        p_rider_id: rider.id,
        p_lat: latitude,
        p_long: longitude
      });
    }

    return successResponse(res, {}, 'Location updated');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Accept a New Order
 */
export const acceptOrder = async (req, res) => {
  const { orderId } = req.body;
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id, user_id, approval_status')
      .eq('user_id', req.user.id)
      .single();

    if (!rider || rider.approval_status !== 'approved') {
      return errorResponse(res, 'Rider not found or not approved', 403);
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, rider_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) return errorResponse(res, 'Order not found', 404);
    if (order.rider_id) return errorResponse(res, 'Order already accepted by another rider', 400);

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        rider_id: rider.user_id, 
        status: 'accepted',
        status_updated_at: new Date().toISOString(),
        status_updated_by: req.user.id,
        status_updated_role: 'rider'
      })
      .eq('id', orderId)
      .select('*, store:stores(name, address, latitude, longitude), address:addresses(*)')
      .single();

    if (updateError) return errorResponse(res, 'Failed to accept order', 400, updateError);

    return successResponse(res, { order: updatedOrder }, 'Order accepted successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List Active Orders for the Rider
 */
export const getActiveOrders = async (req, res) => {
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id, user_id')
      .eq('user_id', req.user.id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, store:stores(name, address, latitude, longitude), address:addresses(*)')
      .eq('rider_id', rider.user_id)
      .in('status', ['accepted', 'picked_up', 'ready'])
      .order('updated_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch orders', 400, error);
    return successResponse(res, { orders: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update Delivery Status (Picked up -> Delivered)
 */
export const updateDeliveryStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) return errorResponse(res, 'Order not found', 404);

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: status, 
        status_updated_at: new Date().toISOString(),
        status_updated_by: req.user.id,
        status_updated_role: 'rider'
      })
      .eq('id', orderId)
      .select('*, store:stores(name, address, latitude, longitude), address:addresses(*)')
      .single();

    if (updateError) return errorResponse(res, 'Failed to update delivery status', 400, updateError);

    try {
      let title = '';
      let body = '';
      if (status === 'picked_up') {
        title = 'Order Out for Delivery! 🚚';
        body = `Our rider has picked up your order #${updatedOrder.order_number} and is on the way.`;
      } else if (status === 'delivered') {
        title = 'Order Delivered! 🎉';
        body = `Your order #${updatedOrder.order_number} has been delivered successfully.`;
      }

      if (title) {
        await notificationService.sendToUser(updatedOrder.user_id, title, body, { 
          type: 'delivery_update', 
          status: status, 
          order_id: updatedOrder.id 
        });
      }
    } catch (err) {
      console.error('[Notification Error] Failed to send delivery update:', err);
    }

    return successResponse(res, { order: updatedOrder }, `Status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Today's Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id, user_id')
      .eq('user_id', req.user.id)
      .single();

    if (!rider) return errorResponse(res, 'Rider not found', 404);

    // Adjust to IST for "Today" calculation
    const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    today.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('rider_id', rider.user_id)
      .eq('status', 'delivered')
      .gte('updated_at', today.toISOString());

    const { data: activity, error: activityError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, updated_at, store:stores(name)')
      .eq('rider_id', rider.user_id)
      .order('updated_at', { ascending: false })
      .limit(5);

    const recent_activity = (activity || []).map(a => ({
      id: a.id,
      title: `Order ${a.status.replace('_', ' ')} #${a.order_number}`,
      time: new Date(a.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: a.store?.name || 'Local'
    }));

    return successResponse(res, {
      today_orders: count || 0,
      recent_activity
    });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Complete Order History
 */
export const getOrderHistory = async (req, res) => {
  const { startDate, endDate, status, page = 1, pageSize = 20 } = req.query;
  const from = (Number(page) - 1) * Number(pageSize);
  const to = from + Number(pageSize) - 1;

  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id, user_id')
      .eq('user_id', req.user.id)
      .single();

    let query = supabaseAdmin
      .from('orders')
      .select('*, store:stores(name)', { count: 'exact' })
      .eq('rider_id', rider.user_id);

    if (startDate) query = query.gte('updated_at', startDate);
    if (endDate) query = query.lte('updated_at', `${endDate} 23:59:59`);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) return errorResponse(res, 'Failed to fetch history', 400, error);

    const formattedOrders = data.map(o => ({
      id: o.order_number,
      original_id: o.id,
      date: new Date(o.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: o.status,
      store: o.store?.name || 'Hub'
    }));

    return successResponse(res, { 
      orders: formattedOrders,
      pagination: {
        total: count,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Specific Order Details for Rider
 */
export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        store:stores(*),
        address:addresses(*),
        customer:profiles!user_id(full_name, phone, email),
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) return errorResponse(res, 'Order details not found', 404, error);
    return successResponse(res, { order: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Available Orders Pool (Pending Assignment)
 */
export const getAvailableOrders = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, store:stores(name, address)')
      .eq('status', 'ready')
      .is('rider_id', null)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch available orders', 400, error);

    const formattedOrders = data.map(o => ({
      id: o.order_number,
      original_id: o.id,
      date: new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: o.status,
      store: o.store?.name || 'Store',
      store_address: o.store?.address || ''
    }));

    return successResponse(res, { orders: formattedOrders });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Log Daily Distance Manually
 */
export const logDistance = async (req, res) => {
  const { start_reading, end_reading, notes } = req.body;
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!rider) return errorResponse(res, 'Rider profile not found', 404);

    // Get current date in IST
    const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const distance = Number(end_reading) - Number(start_reading);

    if (distance < 0) {
      return errorResponse(res, 'End reading cannot be less than start reading', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('rider_distance_logs')
      .upsert({
        rider_id: rider.id,
        log_date: today,
        start_reading: Number(start_reading),
        end_reading: Number(end_reading),
        distance_km: distance,
        notes: notes || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'rider_id, log_date' })
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to log distance', 400, error);
    return successResponse(res, { log: data }, 'Distance logged successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Distance Log History
 */
export const getDistanceHistory = async (req, res) => {
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!rider) return errorResponse(res, 'Rider profile not found', 404);

    const { data, error } = await supabaseAdmin
      .from('rider_distance_logs')
      .select('*')
      .eq('rider_id', rider.id)
      .order('log_date', { ascending: false })
      .limit(30);

    if (error) return errorResponse(res, 'Failed to fetch distance history', 400, error);
    return successResponse(res, { logs: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};