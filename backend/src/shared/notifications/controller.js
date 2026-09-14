import * as notifRepo from './repository.js';
import * as notifService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const rawData = await notifRepo.getUserNotifications(req.user.id);
    const notifications = (rawData || []).map(n => ({
      ...n,
      is_read: n.isRead !== undefined ? n.isRead : n.is_read,
      isRead: n.isRead !== undefined ? n.isRead : n.is_read,
    }));
    return successResponse(res, { notifications }, 'Notifications fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notifications', 500, error);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await notifRepo.markAsRead(id, req.user.id);
    return successResponse(res, updated, 'Notification marked as read');
  } catch (error) {
    return errorResponse(res, 'Failed to update notification', 500, error);
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const rawData = await notifRepo.getAllNotifications();
    const notifications = (rawData || []).map(n => ({
      ...n,
      created_at: n.createdAt,
      is_read: n.isRead !== undefined ? n.isRead : n.is_read,
      isRead: n.isRead !== undefined ? n.isRead : n.is_read,
    }));
    return successResponse(res, { notifications, total: notifications.length }, 'All notifications fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notifications', 500, error);
  }
};

export const sendManualNotification = async (req, res) => {
  const { title, body, role, user_id, targetType, targetValue, type = 'info', data = {} } = req.body;
  if (!title || !body) {
    return errorResponse(res, 'Title and body are required', 400);
  }

  // Resolve target role or user
  let targetUserId = user_id;
  let targetRole = role;

  if (targetType === 'user' && targetValue) {
    targetUserId = targetValue;
  } else if (targetType === 'role' && targetValue) {
    targetRole = targetValue;
  }

  const notifType = data?.type || type;
  const payloadData = { ...data, type: notifType, targetType, targetValue };

  try {
    if (targetUserId) {
      await notifService.sendToUser(targetUserId, title, body, payloadData);
    } else if (targetType === 'topic' && targetValue) {
      await notifRepo.createNotification({
        userId: null,
        title,
        body,
        type: notifType,
        data: payloadData,
      });
      await notifService.sendToTopic(targetValue, title, body, payloadData);
    } else if (targetRole) {
      await notifRepo.createNotification({
        userId: null,
        title,
        body,
        type: notifType,
        data: payloadData,
      });
      await notifService.broadcastToRole(targetRole, title, body, payloadData);
    } else {
      await notifRepo.createNotification({
        userId: null,
        title,
        body,
        type: notifType,
        data: payloadData,
      });
      await notifService.broadcastToAll(title, body, payloadData);
    }
    return successResponse(res, null, 'Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification:', error);
    return errorResponse(res, 'Failed to send notification', 500, error);
  }
};
