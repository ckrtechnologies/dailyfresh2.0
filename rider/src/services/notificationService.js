import messaging from '@react-native-firebase/messaging';
import { Alert, Platform, Vibration } from 'react-native';
import api from './api';

class NotificationService {
    async requestUserPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('[NotificationService] Authorization status:', authStatus);
                await this.getToken();
            }
        } catch (err) {
            console.log('[NotificationService] Permission Error:', err);
        }
    }

    async getToken() {
        try {
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('[NotificationService] FCM Token:', fcmToken);
                await api.patch('/rider/fcm-token', { fcm_token: fcmToken });
            }
        } catch (error) {
            console.error('[NotificationService] Error getting token:', error);
        }
    }

    async setupListeners(onNewOrder) {
        messaging().onMessage(async remoteMessage => {
            console.log('[NotificationService] Foreground Message:', remoteMessage);
            
            // Generic vibration for all messages
            Vibration.vibrate(500);

            if (remoteMessage.data?.type === 'NEW_ORDER_AVAILABLE') {
                Vibration.vibrate([0, 500, 200, 500], true);
                onNewOrder(remoteMessage.data);
            } else if (remoteMessage.notification) {
                // Show a simple alert for general notifications in foreground
                Alert.alert(
                    remoteMessage.notification.title || 'Notification',
                    remoteMessage.notification.body || ''
                );
            }
        });

        // Background/Killed Message
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('[NotificationService] Background Message:', remoteMessage);
        });

        // App opened from notification
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('[NotificationService] App opened from notification:', remoteMessage);
        });
    }
}

export default new NotificationService();
