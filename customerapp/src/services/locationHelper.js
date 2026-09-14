import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import apiClient from '../api/apiClient';
import { setLocation, setSelectedAddress } from '../store/slices/locationSlice';

/**
 * Request Fine Location Permission across Android & iOS
 */
export const requestFineLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Daily Fresh Location',
          message: 'Enable location access to instantly find the nearest fresh delivery store near you.',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[LocationHelper] Permission request error:', err);
      return false;
    }
  }

  return false;
};

/**
 * Reverse geocode latitude & longitude to extract neighbourhood, city, and pincode
 */
export const reverseGeocodeCoords = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DailyFreshCustomerApp/1.0' },
    });
    const data = await response.json();
    const addr = data?.address || {};

    const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || '';
    const city = addr.city || addr.town || addr.municipality || addr.city_district || addr.district || addr.county || addr.state_district || '';
    const state = addr.state || '';
    const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';

    let displayAddress = '';
    if (neighborhood && city) {
      displayAddress = `${neighborhood}, ${city}`;
    } else if (city) {
      displayAddress = city;
    } else {
      displayAddress = data?.display_name?.split(',').slice(0, 2).join(', ') || 'Current Location';
    }

    return {
      success: true,
      neighborhood,
      city,
      state,
      pincode,
      displayAddress,
      raw: data,
    };
  } catch (error) {
    console.warn('[LocationHelper] Reverse geocoding failed:', error);
    return {
      success: false,
      neighborhood: '',
      city: '',
      state: '',
      pincode: '',
      displayAddress: 'Current Location',
    };
  }
};

/**
 * Seamlessly detect location & assign nearest store (Blinkit-style)
 * Prioritizes device GPS location so physical location is never overridden by old addresses
 */
export const autoAssignNearestStore = async (dispatch, { isAuthenticated = false } = {}) => {
  // 1. Attempt device GPS detection first to honor physical location (e.g. Noida)
  const hasPermission = await requestFineLocationPermission();
  if (hasPermission) {
    try {
      const gpsResult = await new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const geocode = await reverseGeocodeCoords(latitude, longitude);

              const storeRes = await apiClient.get('/customer/stores/nearest', {
                params: {
                  lat: latitude,
                  lng: longitude,
                  pincode: geocode.pincode || undefined,
                },
              });

              const storeData = storeRes.data?.data;
              const store = storeData?.store;
              const isDeliverable = storeData?.is_deliverable !== false && !!store;

              const locationPayload = {
                pincode: geocode.pincode || (store?.pincode || ''),
                address: geocode.displayAddress,
                coords: { lat: latitude, lng: longitude },
                isServiceable: isDeliverable,
                storeId: isDeliverable ? store?.id : null,
                storeName: isDeliverable ? store?.name : null,
                city: geocode.city,
                state: geocode.state,
              };

              dispatch(setLocation(locationPayload));
              resolve({ success: true, isServiceable: isDeliverable, store, locationData: locationPayload });
            } catch (err) {
              console.warn('[LocationHelper] Error resolving store from GPS:', err);
              resolve(null);
            }
          },
          (geoErr) => {
            console.warn('[LocationHelper] GPS error:', geoErr);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
        );
      });

      if (gpsResult && gpsResult.isServiceable) {
        return gpsResult;
      }
    } catch (gpsEx) {
      console.warn('[LocationHelper] GPS lookup exception:', gpsEx);
    }
  }

  // 2. If GPS not available/serviceable, check saved addresses for authenticated user
  if (isAuthenticated) {
    try {
      const res = await apiClient.get('/customer/addresses');
      const addressList = res.data?.data?.addresses || res.data?.addresses || [];
      if (addressList.length > 0) {
        const defaultAddr = addressList.find((a) => a.is_default || a.isDefault) || addressList[0];
        
        const storeParams = defaultAddr.pincode
          ? { pincode: defaultAddr.pincode }
          : { lat: defaultAddr.latitude, lng: defaultAddr.longitude };

        const storeRes = await apiClient.get('/customer/stores/nearest', {
          params: storeParams,
        });

        const storeData = storeRes.data?.data;
        const store = storeData?.store;
        const isDeliverable = storeData?.is_deliverable === true && !!store;

        const addressWithStore = {
          ...defaultAddr,
          store_id: isDeliverable ? store?.id : null,
          store_name: isDeliverable ? store?.name : null,
          is_serviceable: isDeliverable,
        };

        dispatch(setSelectedAddress(addressWithStore));
        return { success: true, isServiceable: isDeliverable, store, address: addressWithStore };
      }
    } catch (savedErr) {
      console.warn('[LocationHelper] Error fetching saved addresses:', savedErr);
    }
  }

  return { success: false, reason: 'no_location_found' };
};
