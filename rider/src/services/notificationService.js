import messaging from '@react-native-firebase/messaging';
import { Alert, Platform, Vibration } from 'react-native';
import api from './api';
import * as RootNavigation from '../navigation/RootNavigation';

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
            if (Platform.OS === 'ios') {
                console.log('[NotificationService] Registering device for remote messages (iOS)...');
                await messaging().registerDeviceForRemoteMessages();
            }
            
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('[NotificationService] Obtained FCM Token:', fcmToken);
                await api.patch('/rider/fcm-token', { fcm_token: fcmToken });
                console.log('[NotificationService] FCM Token registered with backend successfully.');
            } else {
                console.warn('[NotificationService] Failed to obtain FCM Token - token is null/undefined');
            }
        } catch (error) {
            console.error('[NotificationService] Error in getToken/registration:', error);
        }
    }

    async setupListeners(onNewOrder) {
        // Foreground Message
        this.messageListener = messaging().onMessage(async remoteMessage => {
            console.log('[NotificationService] Foreground Message:', remoteMessage);
            Vibration.vibrate(500);

            if (remoteMessage.data?.type === 'NEW_ORDER_AVAILABLE') {
                Vibration.vibrate([0, 500, 200, 500], true);
                RootNavigation.navigate('NewOrder', { order: remoteMessage.data });
                if (onNewOrder) onNewOrder(remoteMessage.data);
            } else if (remoteMessage.notification) {
                Alert.alert(
                    remoteMessage.notification.title || 'Notification',
                    remoteMessage.notification.body || ''
                );
            }
        });

        // App opened from notification
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('[NotificationService] App opened from notification:', remoteMessage);
            if (remoteMessage.data?.type === 'NEW_ORDER_AVAILABLE') {
                RootNavigation.navigate('NewOrder', { order: remoteMessage.data });
            }
        });

        // Check if app was opened from killed state by notification
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
            console.log('[NotificationService] App opened from quit state:', initialNotification);
            if (initialNotification.data?.type === 'NEW_ORDER_AVAILABLE') {
                // Short delay to ensure navigation is ready
                setTimeout(() => {
                    RootNavigation.navigate('NewOrder', { order: initialNotification.data });
                }, 1000);
            }
        }
    }

    removeListeners() {
        if (this.messageListener) {
            this.messageListener();
        }
    }
}

export default new NotificationService();
