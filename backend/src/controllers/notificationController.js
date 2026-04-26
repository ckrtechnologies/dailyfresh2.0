import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Admin: Send Broadcast Notification to a Role
 */

/**
 * Admin: Send Manual Notification
 * Supports single user, role broadcast, or all broadcast
 */
export const sendManualNotification = async (req, res) => {
  const { targetType, targetValue, title, body, data } = req.body;
  
  try {
    let result;
    switch (targetType) {
      case 'user':
        result = await notificationService.sendToUser(targetValue, title, body, data);
        break;
      case 'role':
        result = await notificationService.broadcastToRole(targetValue, title, body, data);
        break;
      case 'all':
        result = await notificationService.broadcastToAll(title, body, data);
        break;
      case 'topic':
        result = await notificationService.sendToTopic(targetValue, title, body, data);
        break;
      default:
        return errorResponse(res, 'Invalid target type', 400);
    }

    return successResponse(res, { result }, 'Notification(s) sent successfully');
  } catch (error) {
    console.error('[NMS Controller] Error:', error);
    return errorResponse(res, 'Failed to process NMS request', 500, error);
  }
};

/**
 * Admin: Get Notification History
 */
export const getAllNotifications = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*, profile:profiles(full_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return successResponse(res, { notifications: data });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notification history', 500, error);
  }
};

/**
 * Customer: Get Notifications Feed
 */
export const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(res, 'Failed to fetch notifications', 400, error);
    return successResponse(res, { notifications: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Customer: Mark Notification as Read
 */
export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Update failed', 400, error);
    return successResponse(res, { notification: data }, 'Notification marked as read');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
