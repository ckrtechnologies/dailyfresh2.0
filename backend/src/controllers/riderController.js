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
    const { error } = await supabaseAdmin
      .from('riders')
      .update({ current_lat: latitude, current_lng: longitude })
      .eq('user_id', req.user.id);

    if (error) return errorResponse(res, 'Failed to update location', 400, error);

    const io = req.app.get('io');
    if (io) {
       io.to(`rider-${req.user.id}`).emit('location_update', { latitude, longitude });
    }

    return successResponse(res, {}, 'Location updated');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List Deliveries for the Rider
 */
export const getDeliveries = async (req, res) => {
  const { status } = req.query;
  try {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let query = supabaseAdmin
      .from('deliveries')
      .select('*, order:orders(*)')
      .eq('rider_id', rider.id);

    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch deliveries', 400, error);
    return successResponse(res, { deliveries: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update Delivery Task Status
 */
export const updateDeliveryStatus = async (req, res) => {
  const { deliveryId } = req.params;
  const { status, otp } = req.body;

  try {
    const { data: delivery, error: fetchError } = await supabaseAdmin
      .from('deliveries')
      .select('*, order:orders(id)')
      .eq('id', deliveryId)
      .single();

    if (fetchError || !delivery) return errorResponse(res, 'Delivery not found', 404);

    let orderStatus = 'out_for_delivery';
    if (status === 'delivered') orderStatus = 'delivered';
    
    // Fetch current status for transition validation
    const { data: currentOrder } = await supabaseAdmin.from('orders').select('status').eq('id', delivery.order.id).single();
    
    try {
      validateTransition(currentOrder.status, orderStatus, 'rider');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }

    if (orderStatus === 'delivered') {
      // Delivered status requires proof or valid OTP
      if (!otp && !req.body.proof_url) {
        return errorResponse(res, 'Proof or OTP is required for delivery', 400);
      }
      
      if (otp && otp !== delivery.otp) {
        return errorResponse(res, 'Invalid Delivery OTP', 400);
      }
    }

    const { data: updatedDelivery, error: updateError } = await supabaseAdmin
      .from('deliveries')
      .update({ 
        status, 
        ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        ...(req.body.proof_url ? { delivery_proof: req.body.proof_url } : {})
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (updateError) return errorResponse(res, 'Failed to update delivery', 400, updateError);

    await supabaseAdmin
      .from('orders')
      .update({ 
        status: orderStatus, 
        status_updated_by: req.user.id,
        status_updated_role: 'rider',
        ...(req.body.proof_url ? { delivery_proof_url: req.body.proof_url } : {}),
        ...(status === 'delivered' ? { delivery_otp_verified: true } : {})
      })
      .eq('id', delivery.order.id);

    // --- PUSH NOTIFICATIONS ---
    try {
      const { data: fullOrder } = await supabaseAdmin
        .from('orders')
        .select('user_id, order_number')
        .eq('id', delivery.order.id)
        .single();

      if (fullOrder) {
        let title = '';
        let body = '';
        if (status === 'picked_up') {
          title = 'Order Out for Delivery! 🚚';
          body = `Our rider has picked up your order #${fullOrder.order_number} and is on the way.`;
        } else if (status === 'delivered') {
          title = 'Order Delivered! 🎉';
          body = `Your order #${fullOrder.order_number} has been delivered successfully. Enjoy your fresh products!`;
        }

        if (title) {
          notificationService.sendToUser(fullOrder.user_id, title, body, { 
            type: 'delivery_update', 
            status: status, 
            order_id: fullOrder.id 
          });
        }
      }
    } catch (err) {
      console.error('[Notification Error] Failed to send delivery update:', err);
    }

    return successResponse(res, { delivery: updatedDelivery }, `Status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
