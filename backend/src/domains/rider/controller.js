import * as riderRepo from './repository.js';
import * as riderService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getProfile = async (req, res) => {
  try {
    const data = await riderService.getRiderProfile(req.user.id);
    return successResponse(res, data, 'Rider profile fetched');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch rider profile', error.status || 500);
  }
};

export const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return errorResponse(res, 'Latitude and longitude are required', 400);
  }
  try {
    await riderService.updateLocation(req.user.id, latitude, longitude);
    return successResponse(res, null, 'Location updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update location', 500, error.message);
  }
};

export const toggleOnlineStatus = async (req, res) => {
  const { is_online } = req.body;
  try {
    await riderService.toggleOnlineStatus(req.user.id, is_online);
    return successResponse(res, { is_online }, `Duty status set to ${is_online ? 'online' : 'offline'}`);
  } catch (error) {
    return errorResponse(res, 'Failed to toggle duty status', 500, error.message);
  }
};

export const getActiveDelivery = async (req, res) => {
  try {
    const order = await riderRepo.findActiveDelivery(req.user.id);
    return successResponse(res, { order: order || null }, 'Active delivery fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch active delivery', 500, error.message);
  }
};

export const getAvailableOrders = async (req, res) => {
  try {
    const orders = await riderRepo.findAvailableOrders();
    const formatted = orders.map(o => ({
      id: o.orderNumber,
      original_id: o.id,
      date: new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: o.status,
      store: o.store?.name || 'Store',
      store_address: o.store?.address || ''
    }));
    return successResponse(res, { orders: formatted });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch available orders', 500, error.message);
  }
};

export const acceptOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return errorResponse(res, 'orderId is required', 400);
  }
  try {
    const updated = await riderService.acceptOrder(orderId, req.user.id);
    return successResponse(res, { order: updated }, 'Order accepted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to accept order', error.status || 500);
  }
};

export const updateDeliveryStatus = async (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return errorResponse(res, 'orderId and status are required', 400);
  }
  try {
    const order = await riderService.updateDeliveryStatus(orderId, req.user.id, status);
    return successResponse(res, { order }, `Status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update status', error.status || 500);
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await riderService.getDashboardStats(req.user.id);
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats', 500, error.message);
  }
};

export const getOrderHistory = async (req, res) => {
  const { startDate, endDate, status, page = 1, pageSize = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(pageSize));
  const offsetNum = (pageNum - 1) * limitNum;

  try {
    const result = await riderRepo.findOrderHistory(req.user.id, {
      startDate,
      endDate,
      status,
      limit: limitNum,
      offset: offsetNum
    });

    const formattedOrders = result.orders.map(o => ({
      id: o.orderNumber,
      original_id: o.id,
      date: new Date(o.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: o.status,
      store: o.store?.name || 'Hub'
    }));

    return successResponse(res, {
      orders: formattedOrders,
      pagination: {
        total: result.total,
        page: pageNum,
        pageSize: limitNum
      }
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch order history', 500, error.message);
  }
};

export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await riderRepo.findOrderWithDetails(orderId);
    if (!order) return errorResponse(res, 'Order details not found', 404);
    return successResponse(res, { order });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch order details', 500, error.message);
  }
};

export const logDistance = async (req, res) => {
  const { start_reading, end_reading, notes } = req.body;
  try {
    const log = await riderService.logDistance(req.user.id, start_reading, end_reading, notes);
    return successResponse(res, { log }, 'Distance logged successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to log distance', error.status || 500);
  }
};

export const getDistanceHistory = async (req, res) => {
  try {
    const rider = await riderRepo.findRiderByUserId(req.user.id);
    if (!rider) return errorResponse(res, 'Rider profile not found', 404);
    const logs = await riderRepo.findDistanceLogs(rider.id);
    return successResponse(res, { logs });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch distance history', 500, error.message);
  }
};

export const toggleOnline = toggleOnlineStatus;
export const getActiveOrders = getActiveDelivery;
export const updateFCMToken = async (req, res) => {
  const { fcm_token } = req.body;
  try {
    const { updateProfile } = await import('../../shared/auth/repository.js');
    await updateProfile(req.user.id, { fcmToken: fcm_token });
    return successResponse(res, null, 'FCM token updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update FCM token', 500, error.message);
  }
};
