import * as riderRepo from './repository.js';
import * as notifService from '../../shared/notifications/service.js';

export const getRiderProfile = async (userId) => {
  const rider = await riderRepo.findRiderByUserId(userId);
  if (!rider) {
    const err = new Error('Rider profile not found');
    err.status = 404;
    throw err;
  }
  return {
    ...rider,
    fullName: rider.profile?.fullName || '',
    phone: rider.profile?.phone || '',
    email: rider.profile?.email || '',
    avatarUrl: rider.profile?.avatarUrl || '',
    storeName: rider.store?.name || ''
  };
};

export const updateLocation = async (userId, lat, lng) => {
  return await riderRepo.updateRiderByUserId(userId, {
    currentLatitude: String(lat),
    currentLongitude: String(lng),
    lastLocationUpdate: new Date()
  });
};

export const toggleOnlineStatus = async (userId, isOnline) => {
  return await riderRepo.updateRiderByUserId(userId, {
    isOnline: Boolean(isOnline)
  });
};

export const acceptOrder = async (orderId, riderUserId) => {
  const updated = await riderRepo.assignRiderToOrder(orderId, riderUserId);
  if (!updated) {
    const err = new Error('Order is no longer available or already accepted by another rider');
    err.status = 400;
    throw err;
  }
  return updated;
};

export const updateDeliveryStatus = async (orderId, riderUserId, status) => {
  const allowed = ['picked_up', 'delivered'];
  if (!allowed.includes(status)) {
    const err = new Error('Invalid delivery status transition');
    err.status = 400;
    throw err;
  }

  const updated = await riderRepo.updateOrderStatus(orderId, riderUserId, status);
  if (!updated) {
    const err = new Error('Order not found or not assigned to you');
    err.status = 404;
    throw err;
  }

  const fullOrder = await riderRepo.findOrderWithDetails(orderId);

  // Send customer push notification
  try {
    let title = '';
    let body = '';
    if (status === 'picked_up') {
      title = 'Order Out for Delivery! 🚚';
      body = `Our rider has picked up your order #${updated.orderNumber} and is on the way.`;
    } else if (status === 'delivered') {
      title = 'Order Delivered! 🎉';
      body = `Your order #${updated.orderNumber} has been delivered successfully.`;
    }

    if (title && updated.customerId) {
      await notifService.sendToUser(updated.customerId, title, body, {
        type: 'delivery_update',
        status,
        order_id: updated.id
      });
    }
  } catch (err) {
    console.error('[Rider Notification Error]', err.message);
  }

  return fullOrder || updated;
};

export const getDashboardStats = async (riderUserId) => {
  const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  today.setUTCHours(0, 0, 0, 0);

  const [todayCount, activity] = await Promise.all([
    riderRepo.countDeliveredOrdersSince(riderUserId, today),
    riderRepo.findRecentRiderOrders(riderUserId, 5)
  ]);

  const recent_activity = activity.map(a => ({
    id: a.id,
    title: `Order ${(a.status || '').replace('_', ' ')} #${a.orderNumber}`,
    time: new Date(a.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: a.store?.name || 'Local'
  }));

  return {
    today_orders: todayCount,
    recent_activity
  };
};

export const logDistance = async (riderUserId, startReading, endReading, notes) => {
  const rider = await riderRepo.findRiderByUserId(riderUserId);
  if (!rider) {
    const err = new Error('Rider profile not found');
    err.status = 404;
    throw err;
  }

  const startNum = Number(startReading);
  const endNum = Number(endReading);
  const distance = endNum - startNum;

  if (distance < 0) {
    const err = new Error('End reading cannot be less than start reading');
    err.status = 400;
    throw err;
  }

  const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
  return await riderRepo.upsertDistanceLog(rider.id, today, startNum, endNum, distance, notes);
};
