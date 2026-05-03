import admin from '../config/firebase.js';
import { supabaseAdmin } from '../config/supabase.js';

// Initialization is now handled in ../config/firebase.js


/**
 * Send Push Notification to a specific User
 */
export const sendToUser = async (userId, title, body, data = {}) => {
  try {
    // 1. Always Log to Database (for in-app notification feed)
    await supabaseAdmin.from('notifications').insert([{
      user_id: userId,
      title,
      body,
      type: data.type || 'info',
      data
    }]);

    // 2. Fetch FCM Token for Push
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token, avatar_url')
      .eq('id', userId)
      .single();

    if (!profile || !profile.fcm_token) {
      console.log(`[Notification] No FCM token for user ${userId}. DB log created.`);
      return;
    }

    // 3. Send Firebase Push
    // NOTE: FCM data payload values must be strings
    const avatarUrl = profile?.avatar_url || 'https://dailyfreshkolkata.in/assets/logo.png';
    const fcmData = {
      image_url: avatarUrl
    };
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          fcmData[key] = String(data[key]);
        }
      });
    }

    const message = {
      notification: { 
        title, 
        body,
        imageUrl: avatarUrl 
      },
      data: {
        ...fcmData,
        title: String(title),
        body: String(body),
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: (data.type?.includes('order') || data.type?.includes('confirmed')) ? 'orders' : 'default',
          priority: 'high',
          sound: 'ding',
          imageUrl: avatarUrl
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'ding.wav',
            badge: 1,
            contentAvailable: true
          }
        },
        headers: {
          'apns-priority': '10'
        }
      },
      token: profile.fcm_token
    };

    const response = await admin.messaging().send(message);
    console.log(`[Notification] Push sent to ${userId}: ${response}`);
    return response;
  } catch (error) {
    console.error(`[Notification Error] ${error.message}`);
  }
};

/**
 * Send Broadcast to a Role
 */
export const broadcastToRole = async (role, title, body, data = {}) => {
  try {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', role)
      .eq('is_active', true);

    if (profiles && profiles.length > 0) {
      // Use internal function
      const promises = profiles.map(p => sendToUser(p.id, title, body, data));
      await Promise.all(promises);
    }
  } catch (error) {
    console.error(`[Broadcast Error] ${error.message}`);
  }
};

/**
 * Send Broadcast to ALL Users
 */
export const broadcastToAll = async (title, body, data = {}) => {
  try {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (profiles && profiles.length > 0) {
      console.log(`[NMS] Broadcasting to ${profiles.length} users`);
      const promises = profiles.map(p => sendToUser(p.id, title, body, data));
      await Promise.all(promises);
    }
    return { success: true, count: profiles?.length || 0 };
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
    const message = {
      notification: { title, body },
      data: { ...data, title, body },
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
  try {
    const { data: log, error } = await supabaseAdmin.from('notifications').insert([{
      user_id: userId,
      title,
      body,
      type,
      data
    }]).select().single();

    if (error) throw error;
    return log;
  } catch (error) {
    console.error(`[In-App Log Error] ${error.message}`);
    throw error;
  }
};
/**
 * Notify all Available Riders about a new order
 */
export const notifyAvailableRiders = async (orderId, orderNumber, storeName) => {
  try {
    // 1. Fetch all online and approved riders
    const { data: riders, error } = await supabaseAdmin
      .from('riders')
      .select('id, fcm_token, user_id')
      .eq('is_online', true)
      .eq('approval_status', 'approved');

    if (error) throw error;
    if (!riders || riders.length === 0) {
      console.log('[Notification] No online riders available for broadcast');
      return;
    }

    console.log(`[Notification] Broadcasting new order #${orderNumber} to ${riders.length} riders`);

    const title = 'New Order Available! 📦';
    const body = `Order #${orderNumber} from ${storeName} is ready for dispatch. Tap to accept.`;

    const promises = riders.map(async (rider) => {
      // 1. Log to Database for History (linked to rider's user_id)
      try {
        await supabaseAdmin.from('notifications').insert([{
          user_id: rider.user_id,
          title,
          body,
          type: 'order',
          data: {
            type: 'NEW_ORDER_AVAILABLE',
            order_id: String(orderId),
            order_number: String(orderNumber),
            store_name: String(storeName)
          }
        }]);
      } catch (logErr) {
        console.error(`[Notification Log Error] Rider ${rider.id}:`, logErr.message);
      }

      if (!rider.fcm_token) return;

      const message = {
        notification: { title, body },
        data: {
          type: 'NEW_ORDER_AVAILABLE',
          order_id: String(orderId),
          order_number: String(orderNumber),
          store_name: String(storeName),
          title: String(title),
          body: String(body),
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            sound: 'default',
            visibility: 'public',
            vibrateTimingsMillis: [0, 500, 200, 500],
          }
        },
        token: rider.fcm_token
      };

      try {
        return admin.messaging().send(message);
      } catch (err) {
        console.error(`[FCM Error] Failed to send to rider ${rider.id}:`, err.message);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`[Broadcast Riders Error] ${error.message}`);
  }
};
