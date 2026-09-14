import React, { useEffect, useState } from 'react';
import { Provider as StoreProvider, useDispatch } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar, ActivityIndicator, View, Platform, LogBox } from 'react-native';
LogBox.ignoreAllLogs();
import { COLORS, THEMES } from './src/constants/theme';
import storage from './src/utils/storage';
import { hydrateAuth } from './src/store/slices/authSlice';
import { hydrateLocation } from './src/store/slices/locationSlice';

import SplashScreen from './src/screens/SplashScreen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import authService from './src/api/authService';
import cartService from './src/api/cartService';
import favoritesService from './src/api/favoritesService';
import { setCredentials, logout } from './src/store/slices/authSlice';
import { setCart, clearCart } from './src/store/slices/cartSlice';
import { clearLocation } from './src/store/slices/locationSlice';
import { clearFavorites, setFavorites, fetchFavoritesAsync } from './src/store/slices/favoritesSlice';
import { clearOrders } from './src/store/slices/orderSlice';
import { resetConfig, hydrateConfig } from './src/store/slices/configSlice';
import { clearProducts } from './src/store/slices/productSlice';

import { Linking } from 'react-native';
import { notificationService } from './src/services/notificationService';
import apiClient, { setAccessToken } from './src/api/apiClient';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AlertProvider } from './src/context/AlertContext';
import { checkAppVersion } from './src/shared/services/versionService';
import ForceUpdateModal from './src/shared/components/ForceUpdateModal';
import { autoAssignNearestStore } from './src/services/locationHelper';
import { parseLoginCallbackUrl } from './src/services/googleAuth';

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [versionPolicy, setVersionPolicy] = useState(null);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { items } = useSelector((state) => state.cart);
  const { selectedSlot } = useSelector((state) => state.config);
  const { user, token, isHydrated: authHydrated } = useSelector((state) => state.auth);
  const { isHydrated: locationHydrated } = useSelector((state) => state.location);
  const isAuthenticated = !!(token && user);
  const [isReady, setIsReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  useEffect(() => {
    const bootstrapAsync = async () => {
      const startTime = Date.now();
      try {
        // 1. Mandatory version check & maintenance mode evaluation
        try {
          const versionData = await checkAppVersion();
          if (versionData) {
            setVersionPolicy(versionData);
          }
        } catch (vErr) {
          console.warn('[Bootstrap] Version check error:', vErr);
        }

        // 2. Hydrate session from local storage JWT
        const sessionToken = await storage.getItem('access_token');
        const savedUser = await storage.getItem('user');

        if (sessionToken) {
          setAccessToken(sessionToken);
          dispatch(hydrateAuth(sessionToken));

          // Fetch fresh profile from backend with token
          try {
            const res = await authService.getUserProfile();
            if (res.success && res.data) {
              dispatch(setCredentials({ user: res.data, token: sessionToken }));
              setProfileLoaded(true);
              dispatch(fetchFavoritesAsync());
            } else if (savedUser) {
              dispatch(setCredentials({ user: savedUser, token: sessionToken }));
              setProfileLoaded(true);
              dispatch(fetchFavoritesAsync());
            }
          } catch (profErr) {
            if (savedUser) {
              dispatch(setCredentials({ user: savedUser, token: sessionToken }));
            }
          }
        }

        // 3. Hydrate location
        const savedPincode = await storage.getItem('pincode');
        const savedAddress = await storage.getItem('address');
        const savedStoreId = await storage.getItem('store_id');
        const savedStoreName = await storage.getItem('store_name');
        const savedCoords = await storage.getItem('coords');
        const savedSelectedAddress = await storage.getItem('selected_address');

        if (savedPincode) {
          dispatch(hydrateLocation({
            pincode: savedPincode,
            address: savedAddress,
            storeId: savedStoreId,
            storeName: savedStoreName,
            coords: savedCoords || null,
            selectedAddress: savedSelectedAddress || null
          }));
        } else {
          try {
            await autoAssignNearestStore(dispatch, { isAuthenticated: !!sessionToken });
          } catch (autoErr) {
            dispatch(hydrateLocation({ pincode: null, address: null }));
          }
        }

        // 4. Hydrate selected delivery slot
        const savedSlot = await storage.getItem('selected_slot');
        if (savedSlot) {
          dispatch(hydrateConfig(savedSlot));
        }
      } catch (e) {
        console.warn('Hydration error:', e);
      } finally {
        setIsReady(true);
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const minDuration = 6000;

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

    // Google SSO Deep Link Callback Listener
    const handleDeepLinkUrl = async (event) => {
      const url = event?.url || event;
      if (!url) return;
      console.log('[App] Deep link received:', url);
      const parsed = parseLoginCallbackUrl(url);
      if (parsed?.token && parsed?.user) {
        console.log('[App] Google SSO Login Succeeded via Deep Link:', parsed.user.email);
        await storage.setItem('access_token', parsed.token);
        await storage.setItem('user', parsed.user);
        setAccessToken(parsed.token);
        dispatch(setCredentials({ user: parsed.user, token: parsed.token }));
        try {
          await autoAssignNearestStore(dispatch, { isAuthenticated: true });
        } catch (locErr) {
          console.log('[App] autoAssignNearestStore error:', locErr);
        }
      }
    };

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) handleDeepLinkUrl(initialUrl);
    });

    const linkingSub = Linking.addEventListener('url', handleDeepLinkUrl);

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (linkingSub?.remove) linkingSub.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    if (isReady) {
      notificationService.setup();
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && token && user) {
      notificationService.updateTokenOnBackend();
    }
  }, [isReady, token, user]);

  // Validate location serviceability on startup or login
  useEffect(() => {
    const validateLocation = async () => {
      if (isReady && locationHydrated) {
        const { pincode, coords, storeId } = store.getState().location;

        // If we have a location but no storeId, or if we just logged in, re-verify
        if ((pincode || coords) && !storeId) {
          try {
            const params = {};
            if (pincode) {
              params.pincode = pincode;
            } else if (coords) {
              params.lat = coords.lat;
              params.lng = coords.lng;
            }

            const res = await apiClient.get('/customer/stores/nearest', { params });
            const storeData = res.data?.data?.store;
            const isDeliverable = res.data?.data?.is_deliverable === true && !!storeData;

            if (!isDeliverable) {
              dispatch(hydrateLocation({ ...store.getState().location, isServiceable: false, storeId: null, storeName: null }));
            } else {
              dispatch(hydrateLocation({
                ...store.getState().location,
                storeId: storeData.id,
                storeName: storeData.name,
                isServiceable: true
              }));
            }
          } catch (e) {
            console.error('Location validation failed:', e);
          }
        }
      }
    };
    validateLocation();
  }, [isReady, locationHydrated, isAuthenticated]);

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

    const fetchSavedFavorites = async () => {
      if (isReady && profileLoaded && token && user) {
        const res = await favoritesService.getFavorites();
        if (res.success) {
          dispatch(setFavorites(res.data));
        }
      }
    };
    fetchSavedFavorites();
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

  const isBlocked = Boolean(versionPolicy?.force_update || versionPolicy?.maintenance_mode);

  if (loading && !isBlocked) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.primary }}>
      <StatusBar
        backgroundColor={activeTheme.primary}
        barStyle="light-content"
        translucent={false}
      />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: activeTheme.primary }}
        edges={['top']}
      >
        <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
          <RootNavigator />
        </View>
      </SafeAreaView>

      <ForceUpdateModal
        visible={isBlocked}
        isMaintenance={Boolean(versionPolicy?.maintenance_mode)}
        title={versionPolicy?.title}
        message={versionPolicy?.message}
        updateUrl={versionPolicy?.update_url}
      />
    </View>
  );
};

const App = () => {
  return (
    <StoreProvider store={store}>
      <SafeAreaProvider>
        <AlertProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AlertProvider>
      </SafeAreaProvider>
    </StoreProvider>
  );
};

export default App;
