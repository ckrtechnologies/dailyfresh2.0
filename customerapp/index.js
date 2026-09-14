/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Handle background and quit state FCM messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM Background/Quit Handler] Received message:', remoteMessage);

  // If the push arrived as data-only (no system tray auto-display by Android), display via Notifee
  if (!remoteMessage.notification && remoteMessage.data) {
    const title = remoteMessage.data.title || 'Daily Fresh Update';
    const body = remoteMessage.data.body || 'You have a new update';
    const isOrder = remoteMessage.data.type?.includes('order') || remoteMessage.data.type === 'delivery_update';
    const channelId = isOrder ? 'orders' : 'dailyfresh_alerts';

    try {
      await notifee.displayNotification({
        title,
        body,
        data: remoteMessage.data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          pressAction: { id: 'default' },
        },
      });
    } catch (err) {
      console.warn('[FCM Background Handler] Notifee display error:', err);
    }
  }
});

// Handle Notifee background events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifee Background Event] Type:', type, detail);
  if (detail.notification?.data) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('pending_deep_link', JSON.stringify({ data: detail.notification.data }));
    } catch (e) {
      console.warn('[Notifee Background Event] Storage error:', e);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
