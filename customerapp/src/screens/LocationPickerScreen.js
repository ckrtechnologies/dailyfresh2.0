import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  PermissionsAndroid,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { setLocation, clearLocation } from '../store/slices/locationSlice';
import { logout } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearOrders } from '../store/slices/orderSlice';
import { clearFavorites } from '../store/slices/favoritesSlice';
import apiClient from '../api/apiClient';
import authService from '../api/authService';
import { showGlobalAlert } from '../services/alertService';

const fetchNearestStore = async ({ lat, lng, pincode } = {}) => {
  try {
    const params = {};
    if (lat) params.lat = lat;
    if (lng) params.lng = lng;
    if (pincode) params.pincode = pincode;
    const res = await apiClient.get('/customer/stores/nearest', { params });
    const data = res.data?.data;
    if (data?.is_deliverable === false || !data?.store) {
      return null;
    }
    return data.store;
  } catch {
    return null;
  }
};

const { width } = Dimensions.get('window');

const LocationPickerScreen = ({ navigation, route = { params: {} } }) => {
  const insets = useSafeAreaInsets();
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [hasSavedAddresses, setHasSavedAddresses] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedAddress, storeId } = useSelector((state) => state.location);
  const isMandatory = !!route.params?.mandatory;
  const params = route.params || {};

  // Only auto-redirect on cold startup if explicitly requested and NOT changing location
  useEffect(() => {
    if (route.params?.autoRedirect && storeId && !route.params?.changeLocation) {
      navigation.replace('AppTabs');
    }
  }, [storeId, route.params?.autoRedirect, route.params?.changeLocation]);

  useEffect(() => {
    const checkAddresses = async () => {
      if (isAuthenticated) {
        try {
          const { data: { addresses } } = await apiClient.get('/customer/addresses');
          setHasSavedAddresses(addresses && addresses.length > 0);
        } catch (e) {
          setHasSavedAddresses(false);
        }
      }
    };
    checkAddresses();
  }, [isAuthenticated]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Daily Fresh needs access to your location to find the nearest store.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const handleCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      showGlobalAlert('Permission Denied', 'Location permission is required to find your address.', 'error');
      return;
    }

    setLoading(true);
    console.log('Attempting GPS fix...');
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('GPS Success:', latitude, longitude);

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          console.log('Fetching from:', url);

          const response = await fetch(url, {
            headers: { 'User-Agent': 'DailyFreshApp' },
          });

          const data = await response.json();
          console.log('Full Geocode Data:', JSON.stringify(data, null, 2));

          const addr = data.address || {};

          // Build a specific address: "Sector 4, Noida"
          const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || '';
          const city = addr.city || addr.town || addr.village || addr.state_district || '';
          const state = addr.state || '';

          let displayAddress = '';
          if (neighborhood && city) {
            displayAddress = `${neighborhood}, ${city}`;
          } else if (city) {
            displayAddress = city;
          } else {
            displayAddress = data.display_name?.split(',').slice(0, 2).join(', ') || 'Unknown Address';
          }

          const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';

          console.log('Resolved Address:', displayAddress);
          console.log('Resolved Pincode:', pincode);

          // Resolve nearest store for this location
          const store = await fetchNearestStore({ lat: latitude, lng: longitude, pincode });

          const locationData = {
            pincode,
            address: displayAddress,
            coords: { lat: latitude, lng: longitude },
            isServiceable: !!store,
            storeId: store?.id || null,
            storeName: store?.name || null,
            city,
            state
          };

          dispatch(setLocation(locationData));
          
          if (!store) {
            setIsComingSoon(true);
            return;
          }

          showGlobalAlert(
            'Store Found!',
            `You are being connected to our ${store.name} branch.`,
            'success',
            [{ text: 'Continue', onPress: () => {
              if (params?.from === 'SavedAddresses' || (isAuthenticated && isMandatory)) {
                navigation.navigate('AddAddress', { locationData });
              } else {
                navigation.replace('AppTabs');
              }
            }}]
          );
        } catch (error) {
          console.error('Geocoding logic error:', error);
          showGlobalAlert('Location Error', 'Failed to resolve your address. Please enter pincode.', 'error');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error('GPS Error:', error);
        showGlobalAlert('GPS Error', `Unable to fetch your location: ${error.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    console.log('LocationPickerScreen mounted');
    // REMOVED: handleCurrentLocation(); - No more auto-picking location
  }, []);

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) {
      showGlobalAlert('Invalid Pincode', 'Please enter a valid 6-digit pincode', 'warning');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Checking Pincode:', pincode);

      // Geocode the pincode FIRST so the backend can use lat/lng for radius checks
      let pincodeCoords = null;
      let localityAddress = `Pincode: ${pincode}`;
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&country=India`, {
          headers: { 'User-Agent': 'DailyFreshApp' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData[0]) {
          pincodeCoords = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
          localityAddress = geoData[0].display_name?.split(',').slice(0, 2).join(', ') || localityAddress;
          console.log('📍 Resolved Pincode Coords:', pincodeCoords);
        }
      } catch (e) {
        console.warn('Pincode geocoding failed:', e);
      }

      // Pass lat/lng so backend can calculate distance against delivery_radius_km
      const store = await fetchNearestStore({
        pincode,
        lat: pincodeCoords?.lat,
        lng: pincodeCoords?.lng
      });
      console.log('🏢 Found Store Mapping:', store ? `${store.name} (ID: ${store.id})` : 'None');

      if (store) {
        const locationData = {
          pincode,
          address: localityAddress,
          coords: pincodeCoords,
          isServiceable: true,
          storeId: store.id,
          storeName: store.name,
        };

        dispatch(setLocation(locationData));
        
        showGlobalAlert(
          'Store Found!',
          `You are being connected to our ${store.name} branch for the freshest delivery.`,
          'success',
          [{ text: 'Continue Shopping', onPress: () => {
            if (params?.from === 'SavedAddresses' || (isAuthenticated && isMandatory)) {
              navigation.navigate('AddAddress', { locationData });
            } else {
              navigation.replace('AppTabs');
            }
          }}]
        );
      } else {
        const locationData = {
          pincode,
          address: localityAddress,
          coords: pincodeCoords,
          isServiceable: false,
          storeId: null,
          storeName: null,
        };
        dispatch(setLocation(locationData));
        setIsComingSoon(true);
      }
    } catch {
      showGlobalAlert('Error', 'Could not check serviceability. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {navigation.canGoBack() && (
            <TouchableOpacity 
              style={{ position: 'absolute', top: Math.max(insets.top, 16), left: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          )}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/DailyFreshLogo.jpeg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>
              {isMandatory ? 'Delivery Address Required' : 'Where should we deliver?'}
            </Text>
            <Text style={styles.subtitle}>
              {isMandatory
                ? 'Please add a delivery address to continue shopping the freshest products.'
                : 'Find the freshest products available in your neighborhood.'}
            </Text>
            {isMandatory && (
              <TouchableOpacity 
                style={styles.switchUserBtn} 
                onPress={() => {
                  showGlobalAlert('Logout', 'Are you sure you want to logout and switch accounts?', 'warning', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', onPress: async () => {
                      await authService.logout();
                      dispatch(logout());
                      dispatch(clearCart());
                      dispatch(clearOrders());
                      dispatch(clearFavorites());
                      dispatch(clearLocation());
                    }}
                  ]);
                }}
              >
                <Icon name="logout" size={16} color={COLORS.primary} />
                <Text style={styles.switchUserText}>Switch User / Logout</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Instant Delivery</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <View style={styles.buttonContent}>
                  <Icon name="crosshairs-gps" size={20} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Detect My Location</Text>
                </View>
              )}
            </TouchableOpacity>

            {isAuthenticated && hasSavedAddresses && (
              <TouchableOpacity
                style={[styles.locationButton, { marginTop: SPACING.m, borderStyle: 'solid', backgroundColor: COLORS.white }]}
                onPress={() => navigation.navigate('SavedAddresses', { from: 'LocationPicker', selectMode: true })}
              >
                <View style={styles.buttonContent}>
                  <Icon name="notebook-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.locationButtonText}>Use Saved Address</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.inputLabel}>Enter Delivery Pincode</Text>
            <View style={styles.pincodeContainer}>
              <TextInput
                style={styles.pincodeInput}
                placeholder="e.g. 201301"
                keyboardType="number-pad"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
                placeholderTextColor={COLORS.gray}
              />
              <TouchableOpacity
                style={[styles.checkButton, loading && styles.disabledButton]}
                onPress={handleCheckPincode}
                disabled={loading}
              >
                <Text style={styles.checkButtonText}>CHECK</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Example: 201301 (Noida), 700001 (Kolkata)</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Delivering the freshest cuts to your doorstep.
            </Text>
          </View>
        </ScrollView>

        {isComingSoon && (
          <View style={styles.overlay}>
            <View style={styles.comingSoonCard}>
              <Icon name="map-marker-off" size={60} color={COLORS.primary} />
              <Text style={styles.comingSoonTitle}>We're Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                We are not currently delivering to your area, but we're expanding fast.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setIsComingSoon(false)}
              >
                <Text style={styles.retryButtonText}>Try Another Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.xl,
    flexGrow: 1,
    paddingBottom: 80,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: SPACING.l,
    borderWidth: 6,
    borderColor: '#f8fafc',
  },
  logo: {
    width: '130%',
    height: '130%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.l,
  },
  switchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.m,
    padding: SPACING.s,
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.s,
  },
  switchUserText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.button,
    padding: SPACING.l,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  locationButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: SPACING.m,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.s,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: SPACING.s,
    marginLeft: 2,
  },
  pincodeContainer: {
    flexDirection: 'row',
  },
  pincodeInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.input,
    padding: SPACING.m,
    fontSize: 18,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.s,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  checkButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    zIndex: 2000,
  },
  comingSoonCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LocationPickerScreen;
