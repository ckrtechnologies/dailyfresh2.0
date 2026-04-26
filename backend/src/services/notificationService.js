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
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (!profile || !profile.fcm_token) {
      console.log(`[Notification] No FCM token for user ${userId}. DB log created.`);
      return;
    }

    // 3. Send Firebase Push
    const message = {
      notification: { title, body },
      data: { 
        ...data, 
        title, // Redundancy for some handlers
        body,
        timestamp: new Date().toISOString() 
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'notification_sound',
          priority: 'high',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK' // Standard for some frameworks, safe to include
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'notification_sound.wav', // APNS usually requires extension, assuming it's available
            badge: 1,
            contentAvailable: true // Critical for background/killed delivery
          }
        },
        headers: {
          'apns-priority': '10' // High priority
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
