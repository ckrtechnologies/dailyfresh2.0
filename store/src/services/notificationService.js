import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { storeApi } from './api';

class NotificationService {
  async requestUserPermission() {
    // 1. Handle Android 13+ (API 33+) explicit permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (!hasPermission) {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (status !== PermissionsAndroid.RESULTS.GRANTED) {
          this.showPermissionAlert();
          return false;
        }
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('FCM Permission granted');

      if (Platform.OS === 'android') {
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
      }
      return true;
    } else {
      this.showPermissionAlert();
      return false;
    }
  }

  showPermissionAlert() {
    Alert.alert(
      'Notifications Disabled 🔔',
      'Please enable notifications to receive real-time updates about new orders and store status.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async updateTokenOnBackend() {
    const hasPermission = await this.requestUserPermission();
    if (hasPermission) {
      const token = await this.getFcmToken();
      if (token) {
        try {
          await storeApi.updateFcmToken(token);
          console.log('FCM token updated on backend');
        } catch (error) {
          console.error('Failed to update FCM token:', error);
        }
      }
    }
  }

  listenForNotifications(navigation) {
    // 1. Foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);

      // Display local notification via Notifee
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Update',
        body: remoteMessage.notification?.body || 'Check your app for details',
        data: remoteMessage.data,
        android: {
          channelId: remoteMessage.data?.type?.includes('order') ? 'orders' : 'default',
          importance: AndroidImportance.HIGH,
          sound: 'ding',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    // 2. Handle notification click when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification clicked (background):', remoteMessage);
      this.handleNotificationNavigation(remoteMessage, navigation);
    });

    // 3. Handle notification click when app is closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification clicked (quit state):', remoteMessage);
          this.handleNotificationNavigation(remoteMessage, navigation);
        }
      });

    // 4. Notifee Foreground Event
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationNavigation(detail.notification, navigation);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  }

  handleNotificationNavigation(message, navigation) {
    if (!message || !navigation) return;

    const data = message.data;
    if (data?.type === 'new_order' || data?.type === 'order_status_update') {
      navigation.navigate('Orders');
    }
  }
}

// Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);

  // We don't necessarily need to do anything here if we just want the 
  // default Android notification behavior, but registering this is 
  // required for data-only messages and reliability.

  // You could also trigger a Notifee notification here if the message 
  // is data-only and doesn't show up automatically.
});

export const notificationService = new NotificationService();
