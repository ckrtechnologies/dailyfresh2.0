import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  PermissionsAndroid,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { setLocation } from '../store/slices/locationSlice';
import apiClient from '../api/apiClient';

const fetchNearestStore = async ({ lat, lng, pincode } = {}) => {
  try {
    const params = {};
    if (lat) params.lat = lat;
    if (lng) params.lng = lng;
    if (pincode) params.pincode = pincode;
    const res = await apiClient.get('/customer/stores/nearest', { params });
    return res.data?.data?.store || null;
  } catch {
    return null; // Non-fatal — fallback handled by backend
  }
};

const { width } = Dimensions.get('window');

const LocationPickerScreen = ({ navigation, route = { params: {} } }) => {
  const insets = useSafeAreaInsets();
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const dispatch = useDispatch();

  const params = route.params || {};

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
      Alert.alert('Permission Denied', 'Location permission is required to find your address.');
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

          const pincode = addr.postcode || '201301';

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

          if (params?.from === 'SavedAddresses') {
            navigation.navigate('AddAddress', { locationData });
          } else {
            navigation.replace('AppTabs');
          }
        } catch (error) {
          console.error('Geocoding logic error:', error);
          Alert.alert('Location Error', 'Failed to resolve your address. Please enter pincode.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error('GPS Error:', error);
        Alert.alert('GPS Error', `Unable to fetch your location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    console.log('LocationPickerScreen mounted');
    handleCurrentLocation();
  }, []);

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Checking Pincode:', pincode);
      const store = await fetchNearestStore({ pincode });
      console.log('🏢 Found Store Mapping:', store ? `${store.name} (ID: ${store.id})` : 'None');
      if (store) {
        const locationData = {
          pincode,
          address: store.address || `Store: ${store.name}`,
          coords: null,
          isServiceable: true,
          storeId: store.id,
          storeName: store.name,
        };

        dispatch(setLocation(locationData));

        if (params?.from === 'SavedAddresses') {
          navigation.navigate('AddAddress', { locationData });
        } else {
          navigation.replace('AppTabs');
        }
      } else {
        setIsComingSoon(true);
      }
    } catch {
      Alert.alert('Error', 'Could not check serviceability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Where should we deliver?</Text>
          <Text style={styles.subtitle}>
            Find the freshest products available in your neighborhood.
          </Text>
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
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.25,
    marginBottom: SPACING.m,
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
