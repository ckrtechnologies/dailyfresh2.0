import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility, EventType, AndroidStyle } from '@notifee/react-native';
import { Platform, Linking } from 'react-native';
import apiClient from '../api/apiClient';
import { fetchActiveOrder } from '../store/slices/orderSlice';
import { navigationRef } from '../navigation/RootNavigator';
import { showGlobalAlert } from '../services/alertService';
import storage from '../utils/storage';

class NotificationService {
  async createChannels() {
    if (Platform.OS !== 'android') return;
    try {
      await notifee.createChannel({
        id: 'dailyfresh_alerts',
        name: 'Daily Fresh Alerts',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
        visibility: AndroidVisibility.PUBLIC,
      });

      await notifee.createChannel({
        id: 'orders',
        name: 'Order Updates',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
        visibility: AndroidVisibility.PUBLIC,
      });

      await notifee.createChannel({
        id: 'default',
        name: 'General Notifications',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
        visibility: AndroidVisibility.PUBLIC,
      });
      console.log('[NotificationService] Notification channels initialized');
    } catch (err) {
      console.warn('[NotificationService] Error creating channels:', err);
    }
  }

  async subscribeToDefaultTopics() {
    try {
      await messaging().subscribeToTopic('all');
      await messaging().subscribeToTopic('customer');
      console.log('[NotificationService] Subscribed to all and customer topics');
    } catch (topicErr) {
      console.warn('[NotificationService] Error subscribing to topics:', topicErr);
    }
  }

  async requestUserPermission() {
    try {
      // 1. Request Firebase Permission (iOS/Android 13+)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[NotificationService] FCM Permission granted:', authStatus);

        // 2. Request Notifee Permission (Specifically for Android 13+ and iOS)
        try {
          const settings = await notifee.requestPermission();
          if (settings.authorizationStatus === 0) { // 0 is AuthorizationStatus.DENIED
            this.showMandatoryPermissionAlert();
            return false;
          }
        } catch (err) {
          console.warn('[NotificationService] Error requesting notifee permission:', err);
        }

        // 3. Create Channels & Subscribe to Topics
        await this.createChannels();
        await this.subscribeToDefaultTopics();

        return true;
      } else {
        this.showMandatoryPermissionAlert();
        return false;
      }
    } catch (err) {
      console.warn('[NotificationService] Permission error:', err);
      return false;
    }
  }

  async setup() {
    try {
      await this.createChannels();
      const hasPermission = await this.requestUserPermission();
      if (hasPermission) {
        await this.getFcmToken();
        await this.subscribeToDefaultTopics();
      }
    } catch (err) {
      console.warn('[NotificationService] setup error:', err);
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
        console.log('[NotificationService] FCM Token:', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('[NotificationService] Error getting FCM token:', error);
    }
    return null;
  }

  async updateTokenOnBackend() {
    const hasPermission = await this.requestUserPermission();
    if (hasPermission) {
      const token = await this.getFcmToken();
      if (token) {
        try {
          await apiClient.patch('/customer/fcm-token', { fcm_token: token, fcmToken: token });
          console.log('[NotificationService] FCM token synced to backend');
        } catch (error) {
          console.error('[NotificationService] Failed to sync FCM token:', error);
        }
      }
    }
  }

  pendingDeepLink = null;

  flushPendingDeepLink() {
    if (this.pendingDeepLink && navigationRef.isReady()) {
      const msg = this.pendingDeepLink;
      this.pendingDeepLink = null;
      console.log('[NotificationService] Flushing pending deep link:', msg);
      this.handleDeepLink(msg);
    }
  }

  handleDeepLink(remoteMessage) {
    if (!remoteMessage) return;

    let data = remoteMessage.data || {};
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    const link = data.link || (remoteMessage.notification && remoteMessage.notification.link);
    const orderId = data.order_id || data.orderId || data.orderID || (data.order && (data.order.id || data.order.order_id));

    if (!navigationRef.isReady()) {
      console.log('[NotificationService] Navigation not ready yet. Queueing deep link for order:', orderId);
      this.pendingDeepLink = remoteMessage;
      return;
    }

    // 1. Direct Order Deep Linking
    if (orderId) {
      const targetId = String(orderId);
      console.log('[NotificationService DeepLink] Direct navigation to OrderDetail:', targetId);
      try {
        navigationRef.navigate('Main', {
          screen: 'OrderDetail',
          params: { orderId: targetId, order: { id: targetId } }
        });
      } catch (navErr) {
        try {
          navigationRef.navigate('OrderDetail', { orderId: targetId, order: { id: targetId } });
        } catch (err2) {
          console.error('[NotificationService DeepLink] Navigation error:', err2);
        }
      }
      return;
    }

    // 2. Link URI handling
    if (link) {
      console.log('[NotificationService DeepLink] Processing link:', link);
      const orderMatch = link.match(/order\/([a-zA-Z0-9_-]+)/);
      if (orderMatch && orderMatch[1]) {
        const matchedId = orderMatch[1];
        try {
          navigationRef.navigate('Main', {
            screen: 'OrderDetail',
            params: { orderId: matchedId, order: { id: matchedId } }
          });
        } catch (navErr) {
          navigationRef.navigate('OrderDetail', { orderId: matchedId, order: { id: matchedId } });
        }
        return;
      }

      if (link.startsWith('dailyfresh://')) {
        Linking.openURL(link).catch(err =>
          console.error('[NotificationService DeepLink] Failed to open internal URL:', err)
        );
      } else {
        Linking.openURL(link).catch(err =>
          console.error('[NotificationService DeepLink] Failed to open external URL:', err)
        );
      }
      return;
    }

    // 3. Fallback: If order update, go to Orders screen; else go to Notifications
    if (data.type?.includes('order') || data.type === 'delivery_update') {
      try {
        navigationRef.navigate('Main', { screen: 'Orders' });
      } catch (e) {
        navigationRef.navigate('Orders');
      }
    } else {
      try {
        navigationRef.navigate('Main', { screen: 'Notifications' });
      } catch (e) {
        navigationRef.navigate('Notifications');
      }
    }
  }

  listenForNotifications(dispatch) {
    // 1. Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('[NotificationService] Foreground notification received:', remoteMessage);

      const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Daily Fresh Update';
      const body = remoteMessage.notification?.body || remoteMessage.data?.body || 'Check your app for updates';
      const orderId = remoteMessage.data?.order_id || remoteMessage.data?.orderId;
      const isOrderUpdate = remoteMessage.data?.type === 'order_status_update' || 
                           remoteMessage.data?.type === 'order_update' || 
                           remoteMessage.data?.type === 'order_confirmed' ||
                           remoteMessage.data?.type === 'order_placed' ||
                           remoteMessage.data?.type === 'delivery_update' ||
                           Boolean(orderId);
      const channelId = isOrderUpdate ? 'orders' : 'dailyfresh_alerts';

      // Update Redux state immediately for real-time order tracking
      if (isOrderUpdate) {
        const finalOrderId = orderId;
        const status = remoteMessage.data?.status;
        if (dispatch && finalOrderId) {
          console.log('[NotificationService] Dispatching order status update:', status);
          dispatch({
            type: 'order/updateOrderStatusLocal',
            payload: { orderId: finalOrderId, status }
          });
          dispatch(fetchActiveOrder());
        }
      }

      // Display System Notification Heads-Up Banner via Notifee
      try {
        if (notifee && typeof notifee.displayNotification === 'function') {
          const rawImageUrl = remoteMessage.data?.image_url || remoteMessage.data?.imageUrl || remoteMessage.notification?.android?.imageUrl;
          const isSvg = typeof rawImageUrl === 'string' && (rawImageUrl.includes('.svg') || rawImageUrl.includes('/svg'));
          const safeImageUrl = (!isSvg && rawImageUrl) ? rawImageUrl : null;

          await notifee.displayNotification({
            title,
            body,
            data: remoteMessage.data || {},
            android: {
              channelId,
              importance: AndroidImportance.HIGH,
              sound: 'default',
              largeIcon: safeImageUrl || 'ic_launcher',
              pressAction: {
                id: 'default',
              },
              style: (safeImageUrl && remoteMessage.data?.type === 'promotion') ? {
                type: AndroidStyle.BIGPICTURE,
                picture: safeImageUrl,
              } : undefined,
            },
          });
        }
      } catch (err) {
        console.warn('[NotificationService] Failed to show notifee notification:', err);
      }

      // Display In-App Visual Alert Pop-Up Dialog
      try {
        const hasOrder = Boolean(orderId || isOrderUpdate);
        showGlobalAlert(
          title,
          body,
          'info',
          [
            { text: 'Dismiss', style: 'cancel' },
            {
              text: hasOrder ? 'View Order' : (remoteMessage.data?.link ? 'View' : 'Open'),
              onPress: () => {
                if (hasOrder || remoteMessage.data?.link) {
                  this.handleDeepLink(remoteMessage);
                } else if (navigationRef.isReady()) {
                  navigationRef.navigate('Notifications');
                }
              }
            }
          ]
        );
      } catch (alertErr) {
        console.warn('[NotificationService] Global alert error:', alertErr);
      }
    });

    // 2. Notifee Foreground Event (Tap banner while app is open)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('[NotificationService] Foreground Press Detected:', detail.notification?.data);
        this.handleDeepLink({ data: detail.notification?.data });
      }
    });

    // 3. Handle notification click when app is opened from background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[NotificationService] Opened from background state:', remoteMessage);
      this.handleDeepLink(remoteMessage);
    });

    // 4. Handle notification click when app opened from quit state (FCM)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[NotificationService] Opened from quit state:', remoteMessage);
          this.handleDeepLink(remoteMessage);
        }
      });

    // 5. Handle notification click when app opened from quit state (Notifee)
    if (notifee && typeof notifee.getInitialNotification === 'function') {
      notifee.getInitialNotification().then(initialNotification => {
        if (initialNotification?.notification?.data) {
          console.log('[NotificationService] Opened from Notifee quit state:', initialNotification.notification.data);
          this.handleDeepLink({ data: initialNotification.notification.data });
        }
      });
    }

    // 6. Check storage for pending deep link saved in background/quit state
    storage.getItem('pending_deep_link').then(saved => {
      if (saved) {
        storage.removeItem('pending_deep_link');
        console.log('[NotificationService] Found pending deep link in storage:', saved);
        this.handleDeepLink(saved);
      }
    }).catch(e => console.warn('[NotificationService] Storage deep link error:', e));

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
      if (typeof unsubscribeOpenedApp === 'function') unsubscribeOpenedApp();
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
