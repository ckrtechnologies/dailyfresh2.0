import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';
import { Platform, Alert, Linking } from 'react-native';
import apiClient from '../api/apiClient';
import { fetchActiveOrder } from '../store/slices/orderSlice';
import { navigationRef } from '../navigation/RootNavigator';
import { showGlobalAlert } from '../services/alertService';

class NotificationService {
  async requestUserPermission() {
    // 1. Request Firebase Permission (iOS/Android 13+)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('FCM Permission granted:', authStatus);

      // 2. Request Notifee Permission (Specifically for Android 13+ and iOS)
      try {
        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus === 0) { // 0 is AuthorizationStatus.DENIED
          this.showMandatoryPermissionAlert();
          return false;
        }
      } catch (err) {
        console.warn('Error requesting notifee permission:', err);
      }

      // 3. Create/Update channels
      if (Platform.OS === 'android') {
        try {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Notifications',
            importance: AndroidImportance.HIGH,
            vibration: true,
            sound: 'ding',
          });

          await notifee.createChannel({
            id: 'orders',
            name: 'Order Updates',
            importance: AndroidImportance.HIGH,
            vibration: true,
            sound: 'ding',
          });
        } catch (err) {
          console.warn('Error creating channels:', err);
        }
      }
      return true;
    } else {
      this.showMandatoryPermissionAlert();
      return false;
    }
  }

  showMandatoryPermissionAlert() {
    showGlobalAlert(
      'Notifications Required 🔔',
      'Daily Fresh needs notification permission to send you order updates and delivery status. Please enable it in settings.',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => notifee.openNotificationSettings()
        },
      ]
    );
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

  handleDeepLink(remoteMessage) {
    if (!remoteMessage) return;

    // Extract link from data payload
    const link = remoteMessage.data?.link;
    if (link) {
      console.log('[DeepLink] Processing link:', link);

      // If it's a dailyfresh:// URL and navigation is ready, use internal navigation
      if (link.startsWith('dailyfresh://') && navigationRef.isReady()) {
        const path = link.replace('dailyfresh://', '');
        console.log('[DeepLink] Internal navigation to path:', path);

        // React Navigation's navigate can handle paths if configured in linking
        // But for simplicity, we can also use Linking.openURL as it's handled by NavigationContainer
        Linking.openURL(link).catch(err =>
          console.error('[DeepLink] Failed to open URL via Linking:', err)
        );
      } else {
        // Fallback to system Linking for https:// or other schemes
        Linking.openURL(link).catch(err =>
          console.error('[DeepLink] Failed to open external URL:', err)
        );
      }
    } else {
      console.log('[DeepLink] No link found in message data');
    }
  }

  listenForNotifications(dispatch) {
    // 1. Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);

      // Handle Order Status Update for real-time state change
      if (remoteMessage.data?.type === 'order_status_update' || remoteMessage.data?.type === 'order_update') {
        const { order_id, orderId, status } = remoteMessage.data;
        const finalOrderId = order_id || orderId;
        if (dispatch) {
          console.log('[Notification] Dispatching order status update:', status);
          dispatch({
            type: 'order/updateOrderStatusLocal',
            payload: { orderId: finalOrderId, status }
          });
          dispatch(fetchActiveOrder());
        }
      }

      // Show System Notification via Notifee
      try {
        if (notifee && typeof notifee.displayNotification === 'function') {
          const isOrderUpdate = remoteMessage.data?.type === 'order_status_update' || 
                               remoteMessage.data?.type === 'order_update' || 
                               remoteMessage.data?.type === 'order_confirmed' ||
                               remoteMessage.data?.type === 'delivery_update';
          const imageUrl = remoteMessage.data?.image_url;

          await notifee.displayNotification({
            title: remoteMessage.notification?.title || 'Daily Fresh Update',
            body: remoteMessage.notification?.body || 'Check your app for updates',
            data: remoteMessage.data,
            android: {
              channelId: isOrderUpdate ? 'orders' : 'default',
              importance: AndroidImportance.HIGH,
              sound: 'ding',
              largeIcon: imageUrl || 'ic_launcher',
              style: (imageUrl && remoteMessage.data?.type === 'promotion') ? {
                type: AndroidStyle.BIGPICTURE,
                picture: imageUrl,
              } : undefined,
              pressAction: {
                id: 'default',
              },
            },
          });
        }
      } catch (err) {
        console.warn('[Notification Error] Failed to show notifee notification:', err);
      }
    });

    // 2. Notifee Foreground Event (Tap while app is open)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('[Notifee] Foreground Press Deteceted:', detail.notification?.data);
        this.handleDeepLink({ data: detail.notification?.data });
      }
    });

    // 3. Background/Quit state message handling
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // 4. Handle notification click when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleDeepLink(remoteMessage);
    });

    // 5. Handle notification click when app is closed (Initial Launch)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleDeepLink(remoteMessage);
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  }
}

export const notificationService = new NotificationService();
