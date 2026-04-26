import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { fetchActiveOrder } from '../store/slices/orderSlice';

class NotificationService {
  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      
      // Create notification channels for Android
      if (Platform.OS === 'android') {
        try {
          if (notifee && typeof notifee.createChannel === 'function') {
            // Default channel with custom sound
            await notifee.createChannel({
              id: 'default',
              name: 'Default Notifications',
              importance: AndroidImportance.HIGH,
              sound: 'notification_sound',
            });

            // Specific channel for Orders with custom sound
            await notifee.createChannel({
              id: 'orders',
              name: 'Order Updates',
              importance: AndroidImportance.HIGH,
              sound: 'notification_sound', // sound file: res/raw/notification_sound.mp3
            });
          }
        } catch (err) {
          console.warn('[Notification Warning] Could not create notifee channels:', err);
        }
      }
      
      return true;
    }
    return false;
  }

  async getFcmToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
    return null;
  }

  async updateTokenOnBackend() {
    const hasPermission = await this.requestUserPermission();
    if (hasPermission) {
      const token = await this.getFcmToken();
      if (token) {
        try {
          await apiClient.patch('/customer/fcm-token', { fcm_token: token });
          console.log('FCM token synced to backend');
        } catch (error) {
          console.error('Failed to sync FCM token:', error);
        }
      }
    }
  }

  listenForNotifications(dispatch) {
    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      
      // 1. Handle Order Status Update for real-time state change
      if (remoteMessage.data?.type === 'order_status_update') {
        const { order_id, status } = remoteMessage.data;
        if (dispatch) {
          console.log('[Notification] Dispatching order status update:', status);
          dispatch({ 
            type: 'order/updateOrderStatusLocal', 
            payload: { orderId: order_id, status } 
          });
          // Also fetch full fresh data to be sure
          dispatch(fetchActiveOrder());
        }
      }

      // 2. Show System Notification (Instead of Alert)
      try {
        // Only attempt if notifee is available (native module check)
        if (notifee && typeof notifee.displayNotification === 'function') {
          const isOrderUpdate = remoteMessage.data?.type === 'order_status_update' || remoteMessage.data?.type === 'order_confirmed';
          
          await notifee.displayNotification({
            title: remoteMessage.notification?.title || 'Daily Fresh Update',
            body: remoteMessage.notification?.body || 'Check your app for updates',
            android: {
              channelId: isOrderUpdate ? 'orders' : 'default',
              importance: AndroidImportance.HIGH,
              sound: 'notification_sound',
              pressAction: {
                id: 'default',
              },
            },
          });
        } else {
          // Fallback to console if native module is missing (needs rebuild)
          console.log('[Notification Fallback] Native notifee not found. Message:', remoteMessage.notification?.body);
        }
      } catch (err) {
        console.warn('[Notification Error] Failed to show notifee notification:', err);
      }
    });

    // Background/Quit state message handling
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle notification click when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
    });

    // Handle notification click when app is closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
        }
      });

    return unsubscribeForeground;
  }
}

export const notificationService = new NotificationService();
