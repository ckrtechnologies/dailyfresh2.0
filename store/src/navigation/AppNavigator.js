import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StatusBar } from 'react-native';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCredentials, setAuthLoading } from '../store/slices/authSlice';
import { supabase } from '../services/supabase';
import { notificationService } from '../services/notificationService';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/SplashScreen';
import { COLORS } from '../theme/theme';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['dailyfreshstore://'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Orders: {
            screens: {
              OrdersList: 'orders',
              OrderDetails: 'order/:orderId',
            },
          },
          Inventory: 'inventory',
          Profile: 'profile',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
        },
      },
    },
  },
};

// Internal component to handle authenticated logic like notifications
function MainStack() {
  const navigation = useNavigation();
  
  useEffect(() => {
    // 1. Sync FCM token with backend
    notificationService.updateTokenOnBackend();
    
    // 2. Start listening for push notifications
    const unsubscribe = notificationService.listenForNotifications(navigation);
    
    return unsubscribe;
  }, [navigation]);

  return <TabNavigator />;
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token
          }));
        }
      } catch (e) {
        console.error('Session check error', e);
      } finally {
        // Adding a slight delay to allow the splash animation to finish nicely
        setTimeout(() => {
          dispatch(setAuthLoading(false));
        }, 1200);
      }
    };
    
    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
