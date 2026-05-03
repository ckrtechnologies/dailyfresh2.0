import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, THEMES, SPACING, RADIUS } from '../constants/theme';
import {
  setCategories,
  setBanners,
  setHomeCollections,
  setFeaturedProducts,
  setCategorySections,
  setLoading
} from '../store/slices/productSlice';
import { setSelectedSlot } from '../store/slices/configSlice';
import productService from '../api/productService';
import apiClient from '../api/apiClient';
import { setSelectedAddress, setLocation } from '../store/slices/locationSlice';
import ProductCard from '../components/ProductCard';
import LogoLoader from '../components/LogoLoader';

const { width } = Dimensions.get('window');
const BANNER_ITEM_GAP = 12;
const BANNER_WIDTH = width * 0.88; // 88% wide — 12% peeks through on right
const BANNER_SNAP = BANNER_WIDTH + BANNER_ITEM_GAP;

// Haversine formula to calculate distance in KM
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current; // For header flow effect
  const bannerRef = useRef(null);

  useEffect(() => {
    // Continuous flow animation for the header glow
    Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const flowTranslateX = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const location = useSelector((state) => state.location);
  const { address, storeId, coords, storeName } = location;
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [storeDetail, setStoreDetail] = useState(null);
  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [distance, setDistance] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isSubscribed = true;

      const fetchAddressAndNotifications = async () => {
        if (!isAuthenticated) return;

        try {
          // 1. Check if we have a location (either selected address OR manual pick)
          if (!location.selectedAddress && !location.storeId) {
            console.log('🔄 [HOME] No location context, fetching addresses...');
            const addrRes = await apiClient.get('/customer/addresses');

            if (!isSubscribed) return;

            if (addrRes.data?.success && addrRes.data.data.addresses.length > 0) {
              const defaultAddr = addrRes.data.data.addresses.find(a => a.is_default) || addrRes.data.data.addresses[0];

              // Resolve store for this address
              const storeRes = await apiClient.get('/customer/stores/nearest', {
                params: { pincode: defaultAddr.pincode, lat: defaultAddr.latitude, lng: defaultAddr.longitude }
              });

              if (!isSubscribed) return;
              const store = storeRes.data?.data?.store;

              const addressWithStore = {
                ...defaultAddr,
                store_id: store?.id,
                store_name: store?.name
              };

              dispatch(setSelectedAddress(addressWithStore));
            } else {
              // MANDATORY LOCATION: Redirect to LocationPicker if no location at all exists
              console.log('⚠️ [HOME] No location or addresses found, redirecting to mandatory picker');
              navigation.reset({
                index: 0,
                routes: [{ name: 'LocationPicker', params: { mandatory: true } }],
              });
            }
          }

          // 2. Fetch unread count
          const response = await apiClient.get('/customer/notifications');
          if (isSubscribed && response.data?.success) {
            const unread = response.data.data.notifications.filter(n => !n.is_read).length;
            setUnreadCount(unread);
          }
        } catch (error) {
          console.log('Failed to fetch home focus data:', error);
        }
      };

      fetchAddressAndNotifications();
      return () => { isSubscribed = false; };
    }, [isAuthenticated, location.selectedAddress, navigation, dispatch])
  );

  const totalHeaderHeight = 120;
  // Header Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [120, 60],
    extrapolate: 'clamp',
  });

  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const headerColor = activeTheme.primary;

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -60], // Shift search bar up as header shrinks
    extrapolate: 'clamp',
  });

  const {
    categories,
    featuredProducts,
    banners,
    flashSale,
    frozenProducts,
    exclusiveOffers,
    trendingProducts,
    newLaunch,
    todaysDeals,
    categorySections,
    loading
  } = useSelector((state) => state.products);
  const { totalCount, totalAmount } = useSelector((state) => state.cart);

  // Filter helper
  const filterBySlot = (products) => {
    if (!products) return [];
    if (!selectedSlot) return products;
    return products.filter(p => {
      const options = p.delivery_options || ['express'];
      const normalizedOptions = options.map(o =>
        o === 'morning' ? 'tmrw_morning' :
          o === 'afternoon' ? 'today_evening' : o
      );

      let supportsSlot = normalizedOptions.includes(selectedSlot);

      // Fallback: Check if any variant supports this slot
      if (!supportsSlot && p.variants && p.variants.length > 0) {
        const slotMap = {
          'tmrw_morning': ['morning', 'tomorrow morning'],
          'today_evening': ['afternoon', 'today evening'],
          'tmrw_evening': ['evening', 'tomorrow evening'],
          'express': ['express', 'express delivery']
        };
        const searchTerms = [selectedSlot, ...(slotMap[selectedSlot] || [])];

        supportsSlot = p.variants.some(v => {
          const vInfo = Array.isArray(v.delivery_info)
            ? v.delivery_info
            : (v.delivery_info ? v.delivery_info.split(',').map(s => s.trim().toLowerCase()) : []);

          return vInfo.some(slot => searchTerms.includes(slot.toLowerCase()));
        });
      }

      if (!supportsSlot) return false;

      // Add stock check
      const isExpress = selectedSlot === 'express';
      const hasStock = isExpress ? (p.express_stock_qty > 0) : (p.scheduled_stock_qty > 0);

      return hasStock;
    });
  };
  const [refreshing, setRefreshing] = useState(false);
  const [flashSaleTimer, setFlashSaleTimer] = useState('');

  // Compute seconds remaining until midnight
  const getSecondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight - now) / 1000);
  };

  const formatCountdown = (totalSeconds) => {
    if (totalSeconds <= 0) return '00h 00m 00s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };


  useEffect(() => {
    if (location.pincode) {
      console.log('📍 [APP_LOCATION_DEBUG]');
      console.log('   Pincode: ', location.pincode);
      console.log('   Store ID:', location.storeId);
      console.log('   Address: ', location.address);
      console.log('   Serviceable:', location.isServiceable);
      console.log('-------------------------');
    }
  }, [location.pincode, location.storeId]);

  const loadData = useCallback(async (isCancelled = { current: false }) => {
    let currentStoreId = storeId;

    // SELF-HEALING: If storeId is missing but we have location, try to fetch it again
    if (!currentStoreId && (location.pincode || location.coords)) {
      console.log('🔄 [HOME_DEBUG] Store ID missing, attempting to re-fetch nearest store...');
      try {
        const params = {};
        if (location.coords) {
          params.lat = location.coords.lat;
          params.lng = location.coords.lng;
        }
        if (location.pincode) params.pincode = location.pincode;

        const res = await apiClient.get('/customer/stores/nearest', { params });
        const store = res.data?.data?.store;

        if (store) {
          console.log('✅ [HOME_DEBUG] Successfully re-assigned store:', store.name);
          currentStoreId = store.id;
          // Sync back to Redux for consistency
          dispatch(setLocation({
            ...location,
            storeId: store.id,
            storeName: store.name,
            isServiceable: true
          }));
        }
      } catch (err) {
        console.error('Failed to re-fetch nearest store in Home:', err);
      }
    }

    if (!currentStoreId) {
      console.log('Skipping loadData: No storeId');
      return;
    }

    try {
      dispatch(setLoading(true));

      const [
        categoriesRes,
        bannersRes,
        featuredRes,
        flashRes,
        trendingRes,
        newLaunchRes,
        frozenRes,
        exclusiveRes,
        dealsRes
      ] = await Promise.all([
        productService.getCategories(selectedSlot, currentStoreId),
        productService.getBanners(),
        productService.getProducts({ isFeatured: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isFlashSale: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isTrending: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isNewLaunch: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isFrozen: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isExclusive: true, storeId: currentStoreId, deliveryType: selectedSlot }),
        productService.getProducts({ isDeal: true, storeId: currentStoreId, deliveryType: selectedSlot }),
      ]);

      if (isCancelled.current) return;

      if (categoriesRes.success) dispatch(setCategories(categoriesRes.data));
      if (bannersRes.success) dispatch(setBanners(bannersRes.data));
      if (featuredRes.success) dispatch(setFeaturedProducts(featuredRes.data));

      dispatch(setHomeCollections({
        flashSale: flashRes.success ? flashRes.data : [],
        frozenProducts: frozenRes.success ? frozenRes.data : [],
        exclusiveOffers: exclusiveRes.success ? exclusiveRes.data : [],
        trendingProducts: trendingRes.success ? trendingRes.data : [],
        newLaunch: newLaunchRes.success ? newLaunchRes.data : [],
        todaysDeals: dealsRes.success ? dealsRes.data : [],
      }));

      // 2. Fetch products for each category to create sections
      if (categoriesRes.success && categoriesRes.data.length > 0) {
        const categoryData = await Promise.all(
          categoriesRes.data.map(async (cat) => {
            const prodRes = await productService.getProducts({
              categoryId: cat.id,
              storeId: currentStoreId,
              deliveryType: selectedSlot
            });
            return {
              id: cat.id,
              title: cat.name,
              products: prodRes.success ? prodRes.data : []
            };
          })
        );

        if (isCancelled.current) return;
        dispatch(setCategorySections(categoryData.filter(c => c.products.length > 0)));
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (!isCancelled.current) {
        dispatch(setLoading(false));
      }
    }
  }, [dispatch, storeId, location.pincode, location.coords]);

  useEffect(() => {
    const isCancelled = { current: false };
    loadData(isCancelled);
    return () => {
      isCancelled.current = true;
    };
  }, [loadData]);

  useEffect(() => {
    const fetchStore = async () => {
      if (storeId) {
        const res = await productService.getStoreDetail(storeId);
        if (res.success) {
          setStoreDetail(res.data);
          if (res.data.latitude && res.data.longitude) {
            if (coords) {
              // User GPS coords available — precise distance
              const dist = getDistance(coords.lat, coords.lng, res.data.latitude, res.data.longitude);
              setDistance(dist);
            } else if (location.pincode) {
              // No GPS — try to geocode the user's pincode for an approximate distance
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&postalcode=${location.pincode}&country=India`,
                  { headers: { 'User-Agent': 'DailyFreshApp' } }
                );
                const geoData = await geoRes.json();
                if (geoData && geoData[0]) {
                  const approxLat = parseFloat(geoData[0].lat);
                  const approxLng = parseFloat(geoData[0].lon);
                  const dist = getDistance(approxLat, approxLng, res.data.latitude, res.data.longitude);
                  setDistance(dist);
                }
              } catch (e) {
                console.warn('Distance geocoding fallback failed:', e);
              }
            }
          }
        }
      }
    };
    fetchStore();
  }, [storeId, coords]);

  // Live flash sale countdown — resets at midnight
  useEffect(() => {
    setFlashSaleTimer(formatCountdown(getSecondsUntilMidnight()));
    const tick = setInterval(() => {
      const secs = getSecondsUntilMidnight();
      setFlashSaleTimer(formatCountdown(secs));
      if (secs <= 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Auto-scroll banners every 3 seconds
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToOffset({
          offset: next * BANNER_SNAP,
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Animated.View style={[
      styles.headerContainer,
      {
        backgroundColor: headerColor,
        height: headerHeight,
      }
    ]}>
      {/* Dynamic Flow Glow Effect */}
      <Animated.View style={[
        styles.headerFlowGlow,
        { transform: [{ translateX: flowTranslateX }] }
      ]} />

      <Animated.View style={[
        styles.headerTop,
        {
          opacity: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate('SavedAddresses', { selectMode: true });
            } else {
              navigation.navigate('LocationPicker');
            }
          }}
        >
          <View style={styles.locationIconWrapper}>
            <Icon name="map-marker" size={18} color={activeTheme.primary} />
          </View>
          <View style={styles.locationTextContainer}>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitle}>
                {location.selectedAddress?.label || address?.split(',')[0] || 'Pick Location'}
                {selectedSlot && (
                  <Text style={styles.deliveryModeLabel}>
                    {' • '}{selectedSlot === 'express' ? '⚡ Express' :
                      selectedSlot === 'today_evening' || selectedSlot === 'afternoon' ? '📅 Today Eve' :
                        selectedSlot === 'tmrw_morning' || selectedSlot === 'morning' ? '📅 Tom. Morn' :
                          '📅 Tom. Eve'}
                  </Text>
                )}
              </Text>
              <Icon name="chevron-down" size={14} color={COLORS.white} />
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {location.selectedAddress
                ? `${location.selectedAddress.line1}${location.selectedAddress.line2 ? ', ' + location.selectedAddress.line2 : ''}`
                : address || 'Select your delivery address'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>


          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="bell-outline" size={24} color={COLORS.white} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadgeContainer}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[
        styles.searchBarContainer,
        { transform: [{ translateY: searchBarTranslateY }] }
      ]}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={styles.searchIconWrapper}>
            <Icon name="magnify" size={22} color={activeTheme.primary} />
          </View>
          <Text style={styles.searchText}>Search "Chicken" or "Fish"</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const handleBannerPress = (banner) => {
    if (!banner.link_url) return;

    const url = banner.link_url;
    // Supported formats: /product/:id, /category/:id, /search/:query
    if (url.startsWith('/product/')) {
      const id = url.split('/product/')[1];
      navigation.navigate('ProductDetail', { productId: id });
    } else if (url.startsWith('/category/')) {
      const id = url.split('/category/')[1];
      navigation.navigate('ProductList', {
        title: banner.title || 'Category',
        type: 'category',
        categoryId: id
      });
    } else if (url.startsWith('/search/')) {
      const query = url.split('/search/')[1];
      navigation.navigate('ProductList', {
        title: `Search: ${query}`,
        type: 'search',
        searchQuery: query
      });
    }
  };

  const renderBanners = () => {
    const data = banners.length > 0
      ? banners
      : [{ id: 'placeholder', image_url: 'https://via.placeholder.com/800x400' }];

    return (
      <View style={styles.bannerContainer}>
        <FlatList
          ref={bannerRef}
          data={data}
          horizontal
          pagingEnabled={false}
          snapToInterval={BANNER_SNAP}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: SPACING.l, paddingRight: SPACING.s }}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_SNAP);
            setCurrentBannerIndex(index);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.bannerWrapper}
              onPress={() => handleBannerPress(item)}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
        {data.length > 1 && (
          <View style={styles.dotsContainer}>
            {data.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentBannerIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const getSectionIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('flash')) return 'lightning-bolt';
    if (t.includes('deal')) return 'tag-heart';
    if (t.includes('frozen')) return 'snowflake';
    if (t.includes('exclusive')) return 'crown';
    if (t.includes('trending')) return 'trending-up';
    if (t.includes('new')) return 'star-face';
    if (t.includes('fresh')) return 'fish';
    if (t.includes('category')) return 'format-list-bulleted-type';
    return 'star';
  };

  const renderProductSection = (title, data, timer = null, type = 'all', extraParams = {}) => {
    if (!data || data.length === 0) return null;

    const iconName = getSectionIcon(title);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: activeTheme.primary + '10', shadowColor: activeTheme.primary }]}>
              <Icon name={iconName} size={18} color={activeTheme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: activeTheme.text }]}>{title}</Text>
            {timer && (
              <View style={styles.timerBadge}>
                <Icon name="timer-outline" size={14} color={COLORS.white} />
                <Text style={styles.timerText}>{timer}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProductList', {
            title,
            type,
            initialProducts: data,
            ...extraParams
          })}>
            <View style={styles.viewAllContainer}>
              <Text style={[styles.viewAll, { color: activeTheme.primary }]}>View All</Text>
              <Icon name="chevron-right" size={18} color={activeTheme.primary} />
            </View>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item, index }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              horizontal={true}
              size={index === 0 ? 'tall' : 'small'}
            />
          )}
        />
      </View>
    );
  };

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconCircle, { backgroundColor: activeTheme.primary + '10', shadowColor: activeTheme.primary }]}>
            <Icon name="format-list-bulleted-type" size={18} color={activeTheme.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: activeTheme.text }]}>Shop by Category</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
          <View style={styles.viewAllContainer}>
            <Text style={[styles.viewAll, { color: activeTheme.primary }]}>View All</Text>
            <Icon name="chevron-right" size={18} color={activeTheme.primary} />
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={styles.categoryConsistantCard}
              onPress={() => navigation.navigate('ProductList', {
                title: item.name,
                type: 'category',
                categoryId: item.id
              })}
            >
              <View style={styles.categoryImageWrapper}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.categoryCardImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryCardName} numberOfLines={1}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );



  const renderStoreModal = () => (
    <Modal
      visible={isStoreModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsStoreModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Store Details</Text>
            <TouchableOpacity onPress={() => setIsStoreModalVisible(false)}>
              <Icon name="close" size={24} color={activeTheme.text} />
            </TouchableOpacity>
          </View>

          {storeDetail ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.storeDetailCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop' }}
                  style={styles.storeDetailImage}
                />
                <View style={styles.storeDetailInfo}>
                  <Text style={styles.storeDetailName}>{storeDetail.name}</Text>
                  <View style={styles.storeDistanceBadge}>
                    <Icon name="map-marker" size={14} color={activeTheme.primary} />
                    <Text style={[styles.storeDistanceBadgeText, { color: activeTheme.primary }]}>{distance} km away from you</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="phone" size={20} color={activeTheme.primary} />
                    <Text style={[styles.detailValue, { color: activeTheme.textLight }]}>{storeDetail.phone || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="email" size={20} color={activeTheme.primary} />
                    <Text style={[styles.detailValue, { color: activeTheme.textLight }]}>{storeDetail.email || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon name="map-marker-outline" size={20} color={activeTheme.primary} />
                    <Text style={[styles.detailValue, { color: activeTheme.textLight }]}>{storeDetail.address || 'Kolkata, West Bengal'}</Text>
                  </View>

                  <View style={styles.aboutSection}>
                    <Text style={styles.aboutTitle}>About Store</Text>
                    <Text style={styles.aboutText}>
                      Serving fresh meat and seafood daily. Quality guaranteed from our local farms to your doorstep.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 50 }} />
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LogoLoader size={120} />
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <StatusBar
        backgroundColor={activeTheme.primary}
        barStyle="light-content"
        translucent={true}
      />
      {renderHeader()}
      {renderStoreModal()}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
        }
      >
        <View style={{ height: 120 }} />
        {renderBanners()}
        {renderCategories()}
        {renderProductSection('Flash Sale', filterBySlot(flashSale), flashSaleTimer, 'flash_sale')}
        {renderProductSection('Todays Deals', filterBySlot(todaysDeals), null, 'deals')}
        {renderProductSection('Frozen Products', filterBySlot(frozenProducts), null, 'frozen')}
        {renderProductSection('Exclusive Offers', filterBySlot(exclusiveOffers), null, 'exclusive')}
        {renderProductSection('Trending Products', filterBySlot(trendingProducts), null, 'trending')}
        {renderProductSection('New Launch', filterBySlot(newLaunch), null, 'new_launch')}
        {renderProductSection('Fresh Catch', filterBySlot(featuredProducts), null, 'featured')}

        {/* Dynamic Category Sections */}
        {categorySections.map((section) => (
          <React.Fragment key={section.id}>
            {renderProductSection(section.title, filterBySlot(section.products), null, 'category', { categoryId: section.id })}
          </React.Fragment>
        ))}

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Icon name="check-decagram" size={28} color={activeTheme.primary} />
            <Text style={[styles.trustText, { color: activeTheme.text }]}>100% Fresh</Text>
          </View>
          <View style={styles.trustItem}>
            <Icon name="shield-check" size={28} color={activeTheme.primary} />
            <Text style={[styles.trustText, { color: activeTheme.text }]}>Chemical-Free</Text>
          </View>
          <View style={styles.trustItem}>
            <Icon name="truck-delivery" size={28} color={activeTheme.primary} />
            <Text style={[styles.trustText, { color: activeTheme.text }]}>Fast Delivery</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.primary,
    overflow: 'hidden', // Contain the glow
  },
  headerFlowGlow: {
    position: 'absolute',
    top: -50,
    left: 0,
    width: 200,
    height: 250,
    backgroundColor: COLORS.secondary,
    opacity: 0.15,
    borderRadius: 100,
    transform: [{ rotate: '45deg' }],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.m,
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4B6E',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    height: 60,
    justifyContent: 'center',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  addressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: -2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerIconButton: {
    padding: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.s,
    height: 48,
    borderRadius: RADIUS.button,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIconWrapper: {
    padding: 8,
  },
  searchText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '500',
  },
  bannerContainer: {
    marginTop: SPACING.m,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    height: 180,
    marginRight: BANNER_ITEM_GAP,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
    borderRadius: 3,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: 0.2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B6E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: SPACING.s,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryList: {
    paddingLeft: SPACING.l,
  },
  categoryConsistantCard: {
    width: 110,
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  categoryImageWrapper: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryInfo: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginTop: 4,
  },
  horizontalList: {
    paddingLeft: SPACING.l,
    paddingBottom: SPACING.s,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  trustItem: {
    alignItems: 'center',
    width: (width - SPACING.l * 2) / 3,
  },
  trustBadgeImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  headerIconButton: {
    padding: SPACING.s,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.card,
    maxWidth: 160,
  },
  storeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  storeNameText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  distanceText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  slotPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  slotPickerText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.l,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: SPACING.m,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  storeDetailCard: {
    width: '100%',
  },
  storeDetailImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: SPACING.m,
  },
  storeDetailInfo: {
    paddingBottom: SPACING.xl,
  },
  storeDetailName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.dark,
    marginBottom: 4,
  },
  storeDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: SPACING.l,
  },
  storeDistanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray,
  },
  aboutSection: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
});

export default HomeScreen;
