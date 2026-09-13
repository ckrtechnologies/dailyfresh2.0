import * as notifRepo from './repository.js';
import * as notifService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const data = await notifRepo.getUserNotifications(req.user.id);
    return successResponse(res, data, 'Notifications fetched successfully');
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
    const data = await notifRepo.getAllNotifications();
    return successResponse(res, data, 'All notifications fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notifications', 500, error);
  }
};

export const sendManualNotification = async (req, res) => {
  const { title, body, role, user_id, type = 'info' } = req.body;
  if (!title || !body) {
    return errorResponse(res, 'Title and body are required', 400);
  }

  try {
    if (user_id) {
      await notifService.sendToUser(user_id, title, body, { type });
    } else if (role) {
      await notifService.broadcastToRole(role, title, body, { type });
    } else {
      await notifService.broadcastToAll(title, body, { type });
    }
    return successResponse(res, null, 'Notification sent successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to send notification', 500, error);
  }
};
