import React, { useEffect, useState } from 'react';
import { Provider as StoreProvider, useDispatch } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar, ActivityIndicator, View, Platform } from 'react-native';
import { COLORS, THEMES } from './src/constants/theme';
import storage from './src/utils/storage';
import { hydrateAuth } from './src/store/slices/authSlice';
import { hydrateLocation } from './src/store/slices/locationSlice';

import SplashScreen from './src/screens/SplashScreen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import authService from './src/api/authService';
import cartService from './src/api/cartService';
import { setCredentials, logout } from './src/store/slices/authSlice';
import { setCart } from './src/store/slices/cartSlice';

import { Linking } from 'react-native';
import { supabase } from './src/api/supabase';
import { notificationService } from './src/services/notificationService';
import { setAccessToken } from './src/api/apiClient';

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { items } = useSelector((state) => state.cart);
  const { selectedSlot } = useSelector((state) => state.config);
  const { user, token, isHydrated: authHydrated } = useSelector((state) => state.auth);
  const { isHydrated: locationHydrated } = useSelector((state) => state.location);
  const [isReady, setIsReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  useEffect(() => {
    // Handle deep links (for Google SSO)
    const handleDeepLink = async (event) => {
      const { url } = event;
      if (url && url.includes('login-callback')) {
        const params = {};
        const queryString = url.split('#')[1] || url.split('?')[1];
        if (queryString) {
          queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = value;
          });
        }

        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) console.error('Error setting session:', error);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL if app was closed
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Supabase Auth Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth State Changed:', event, session ? 'Session exists' : 'No session');

      // Handle all events that mean we have a valid session
      const isActiveSession = (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED'
      );

      if (isActiveSession && session) {
        setAccessToken(session.access_token);
        dispatch(hydrateAuth(session.access_token));

        // Fetch real profile from backend (only on SIGNED_IN to avoid redundant calls on INITIAL_SESSION)
        if (event === 'SIGNED_IN') {
          try {
            const res = await authService.getUserProfile();
            let backendUser = res.success ? res.data : session.user;

            if (res.success && (!res.data.full_name || !res.data.avatar_url)) {
              const providerName = session.user?.user_metadata?.full_name || session.user?.user_metadata?.name;
              const providerAvatar = session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture;

              if (providerName || providerAvatar) {
                try {
                  const updatePayload = {};
                  if (!res.data.full_name && providerName) updatePayload.full_name = providerName;
                  if (!res.data.avatar_url && providerAvatar) updatePayload.avatar_url = providerAvatar;

                  if (Object.keys(updatePayload).length > 0) {
                    const updateRes = await authService.updateProfile(updatePayload);
                    if (updateRes.success) {
                      backendUser = { ...backendUser, ...updatePayload };
                    }
                  }
                } catch (err) {
                  console.error('Auto profile update failed', err);
                }
              }
            }

            dispatch(setCredentials({ user: backendUser, token: session.access_token }));
            if (res.success) {
              setProfileLoaded(true);
            }
          } catch (e) {
            console.error('Error fetching profile after auth change:', e);
            dispatch(setCredentials({ user: session.user, token: session.access_token }));
            setProfileLoaded(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAccessToken(null);
        setProfileLoaded(false);
        dispatch(logout());
      }
    });

    const bootstrapAsync = async () => {
      const startTime = Date.now();
      try {
        // Use Supabase getSession() — it auto-refreshes the token if expired.
        // Never read access_token directly from storage for API calls.
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setAccessToken(session.access_token);
          dispatch(hydrateAuth(session.access_token));
          
          // Fetch real profile from backend with the fresh token
          const res = await authService.getUserProfile();
          if (res.success) {
            let backendUser = res.data;
            // Auto-update missing fields from SSO metadata
            if (!backendUser.full_name || !backendUser.avatar_url) {
              const providerName = session.user?.user_metadata?.full_name || session.user?.user_metadata?.name;
              const providerAvatar = session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture;
              
              if (providerName || providerAvatar) {
                const updatePayload = {};
                if (!backendUser.full_name && providerName) updatePayload.full_name = providerName;
                if (!backendUser.avatar_url && providerAvatar) updatePayload.avatar_url = providerAvatar;
                
                if (Object.keys(updatePayload).length > 0) {
                  const updateRes = await authService.updateProfile(updatePayload);
                  if (updateRes.success) backendUser = { ...backendUser, ...updatePayload };
                }
              }
            }
            dispatch(setCredentials({ user: backendUser, token: session.access_token }));
            setProfileLoaded(true);
          } else {
            // Profile fetch failed (e.g. 404), fallback to session user but profileLoaded stays false
            dispatch(setCredentials({ user: session.user, token: session.access_token }));
            setProfileLoaded(false);
          }
        }

        // Only hydrate with null if we don't have anything in storage
        const savedPincode = await storage.getItem('pincode');
        const savedAddress = await storage.getItem('address');
        const savedStoreId = await storage.getItem('store_id');
        const savedStoreName = await storage.getItem('store_name');
        const savedCoords = await storage.getItem('coords');

        if (savedPincode) {
          dispatch(hydrateLocation({
            pincode: savedPincode,
            address: savedAddress,
            storeId: savedStoreId,
            storeName: savedStoreName,
            coords: savedCoords ? JSON.parse(savedCoords) : null
          }));
        } else {
          // Force fresh location check ONLY if we have none
          dispatch(hydrateLocation({ pincode: null, address: null }));
        }
      } catch (e) {
        console.warn('Hydration error:', e);
      } finally {
        setIsReady(true);
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const minDuration = 4000; // 4 seconds

        if (elapsedTime < minDuration) {
          setTimeout(() => setLoading(false), minDuration - elapsedTime);
        } else {
          setLoading(false);
        }
      }
    };

    bootstrapAsync();

    // Notification Listeners
    const unsubscribeNotifications = notificationService.listenForNotifications(dispatch);

    return () => {
      subscription.remove();
      if (authListener?.subscription) authListener.subscription.unsubscribe();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [dispatch]);

  useEffect(() => {
    if (isReady && profileLoaded && token && user) {
      notificationService.updateTokenOnBackend();
    }
  }, [isReady, profileLoaded, token, user]);

  useEffect(() => {
    const fetchSavedCart = async () => {
      if (isReady && profileLoaded && token && user) {
        const res = await cartService.getCart();
        if (res.success && Array.isArray(res.data)) {
          // Map backend structure back to frontend structure
          const formattedItems = res.data.map(item => ({
            ...(item.product || {}),
            id: item.product_id,
            quantity: item.quantity,
            cutPreference: item.cut_preference,
            cleaningPreference: item.cleaning_preference
          }));
          dispatch(setCart({ items: formattedItems }));
        }
      }
    };
    fetchSavedCart();
  }, [isReady, token, user]); // Only run when user/token changes (login)

  // Sync cart to backend on changes
  useEffect(() => {
    let timeout;
    // Only sync if user is logged in AND we have items (or an empty array)
    if (isReady && profileLoaded && token && user && Array.isArray(items)) {
      // Debounce sync to avoid too many requests
      timeout = setTimeout(async () => {
        try {
          await cartService.syncCart(items);
        } catch (e) {
          console.error('Failed to sync cart:', e);
        }
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isReady, items, token, user]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.primary }}>
      <StatusBar
        backgroundColor={activeTheme.primary}
        barStyle={activeTheme.statusBar}
        translucent={false}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: activeTheme.primary }}
        edges={['top', 'bottom']}
      >
        <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
          <RootNavigator />
        </View>
      </SafeAreaView>
    </View>
  );
};

const App = () => {
  return (
    <StoreProvider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </StoreProvider>
  );
};

export default App;
