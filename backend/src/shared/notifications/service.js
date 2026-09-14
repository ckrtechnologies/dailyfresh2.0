import * as notifRepo from './repository.js';
import admin from '../../config/firebase.js';

/**
 * Send Push Notification to a specific User
 */
export const sendToUser = async (userId, title, body, data = {}) => {
  try {
    // 1. Always Log to Database
    await notifRepo.createNotification({
      userId,
      title,
      body,
      type: data?.type || 'info',
      data: data || {},
    });

    // 2. Fetch FCM Token for Push
    const profile = await notifRepo.getUserFcmProfile(userId);
    if (!profile || !profile.fcmToken) {
      console.log(`[Notification] No FCM token for user ${userId}. DB log created.`);
      return;
    }

    if (!admin?.messaging) {
      console.warn('[Notification] Firebase Admin messaging not configured. Skipping push.');
      return;
    }

    // 3. Send Firebase Push
    const rawImage = data?.image_url || data?.imageUrl || profile.avatarUrl;
    const isSvg = typeof rawImage === 'string' && (rawImage.includes('.svg') || rawImage.includes('/svg'));
    const safePushImage = (rawImage && !isSvg) ? rawImage : 'https://dailyfreshkolkata.online/assets/logo.png';

    const fcmData = {
      image_url: safePushImage,
      title: String(title),
      body: String(body),
      timestamp: new Date().toISOString(),
    };

    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          fcmData[key] = String(data[key]);
        }
      });
    }

    const orderId = data?.order_id || data?.orderId;
    if (orderId) {
      fcmData.order_id = String(orderId);
      fcmData.orderId = String(orderId);
      if (!fcmData.link) {
        fcmData.link = `dailyfresh://order/${orderId}`;
      }
    }

    const isOrderNotification = Boolean(orderId || data?.type?.startsWith('order') || data?.type === 'delivery_update');
    const channelId = isOrderNotification ? 'orders' : 'dailyfresh_alerts';

    const message = {
      notification: { 
        title, 
        body,
        ...(safePushImage ? { imageUrl: safePushImage } : {})
      },
      data: fcmData,
      android: {
        priority: 'high',
        ttl: 3600 * 1000,
        notification: {
          channelId,
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          ...(safePushImage ? { imageUrl: safePushImage } : {}),
          sticky: false,
          visibility: 'public',
          notificationPriority: 'PRIORITY_HIGH',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
            mutableContent: true,
          }
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        }
      },
      token: profile.fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log(`[Notification] Push sent to ${userId}: ${response}`);
    return response;
  } catch (error) {
    console.error(`[Notification Error] ${error.message}`);
  }
};

/**
 * Send Broadcast to a specific Role
 */
export const broadcastToRole = async (role, title, body, data = {}) => {
  try {
    // Send push to role topic (e.g. 'customer', 'rider') for instant delivery to all devices
    const response = await sendToTopic(role, title, body, data);
    return response;
  } catch (error) {
    console.error(`[Broadcast Error] ${error.message}`);
    throw error;
  }
};

/**
 * Send Broadcast to ALL Active Users
 */
export const broadcastToAll = async (title, body, data = {}) => {
  try {
    // Send push to 'all' topic for instant device delivery to all registered apps
    const response = await sendToTopic('all', title, body, data);
    return { success: true, response };
  } catch (error) {
    console.error(`[Broadcast All Error] ${error.message}`);
    throw error;
  }
};

/**
 * Send to Firebase Topic
 */
export const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    if (!admin?.messaging) {
      console.warn('[Notification] Firebase Admin messaging not configured.');
      return;
    }

    const fcmData = {
      title: String(title),
      body: String(body),
      timestamp: new Date().toISOString(),
    };
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          fcmData[key] = String(data[key]);
        }
      });
    }

    const message = {
      notification: { title, body },
      data: fcmData,
      android: {
        priority: 'high',
        ttl: 3600 * 1000,
        notification: {
          channelId: 'dailyfresh_alerts',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationPriority: 'PRIORITY_HIGH',
          visibility: 'public',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      topic: topic
    };

    const response = await admin.messaging().send(message);
    console.log(`[NMS] Topic notification sent to ${topic}: ${response}`);
    return response;
  } catch (error) {
    console.error(`[Topic Notification Error] ${error.message}`);
    throw error;
  }
};

/**
 * Log In-App Notification (No Push)
 */
export const logInAppNotification = async (userId, title, body, type = 'info', data = {}) => {
  return await notifRepo.createNotification({
    userId,
    title,
    body,
    type,
    data
  });
};

/**
 * Notify all Available Riders about a new order
 */
export const notifyAvailableRiders = async (orderId, orderNumber, storeName, storeAddress = '', itemsSummary = '') => {
  try {
    console.log(`[Notification] Initiating broadcast for order #${orderNumber} from ${storeName}`);
    
    const onlineRiders = await notifRepo.getOnlineApprovedRidersWithProfile();

    if (!onlineRiders || onlineRiders.length === 0) {
      console.log('[Notification] No online riders found in database.');
      return;
    }

    const eligibleRiders = onlineRiders.filter(r => r.profile && r.profile.fcmToken);

    if (eligibleRiders.length === 0) {
      console.log('[Notification] No online riders have valid FCM tokens.');
      return;
    }

    const title = 'New Order Available! 📦';
    const body = `Order #${orderNumber} from ${storeName} is ready for dispatch. Tap to accept.`;

    const promises = eligibleRiders.map(async (rider) => {
      // 1. Log to Database
      try {
        await notifRepo.createNotification({
          userId: rider.userId,
          title,
          body,
          type: 'order',
          data: {
            type: 'NEW_ORDER_AVAILABLE',
            order_id: String(orderId),
            order_number: String(orderNumber),
            store_name: String(storeName),
            store_address: String(storeAddress),
            items_summary: String(itemsSummary)
          }
        });
      } catch (logErr) {
        console.error(`[Notification Log Error] Rider ${rider.profile.fullName || rider.id}:`, logErr.message);
      }

      // 2. Send Firebase Push
      if (!admin?.messaging) return;

      const message = {
        token: rider.profile.fcmToken,
        notification: { title, body },
        data: {
          type: 'NEW_ORDER_AVAILABLE',
          order_id: String(orderId),
          order_number: String(orderNumber),
          store_name: String(storeName),
          store_address: String(storeAddress),
          items_summary: String(itemsSummary)
        },
        android: {
          priority: 'high',
          ttl: 3600 * 1000,
          notification: {
            channelId: 'orders',
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            notificationPriority: 'PRIORITY_HIGH',
            visibility: 'public',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
              mutableContent: true,
            }
          },
          headers: {
            'apns-priority': '10',
            'apns-topic': 'com.rider'
          }
        }
      };

      try {
        const response = await admin.messaging().send(message);
        console.log(`[Notification Success] Push sent to ${rider.profile.fullName || rider.id}: ${response}`);
        return response;
      } catch (err) {
        console.error(`[FCM Error] Failed to send to rider ${rider.profile.fullName || rider.id}:`, err.message);
      }
    });

    await Promise.all(promises);
    console.log(`[Notification] Broadcast completed for order #${orderNumber}`);
  } catch (error) {
    console.error(`[Broadcast Riders Error] ${error.message}`);
  }
};
