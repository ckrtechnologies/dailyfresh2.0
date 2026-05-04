import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import productService from '../../api/productService';
import {
  setLoading,
  setBanners,
  setCategories,
  setFeaturedProducts,
  setCategorySections,
  setHomeCollections
} from '../../store/slices/productSlice';
import { THEMES } from '../../constants/theme';

const useHomeData = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Redux state
  const {
    loading,
    banners,
    categories,
    categorySections,
    featuredProducts,
    flashSale,
    frozenProducts,
    exclusiveOffers,
    trendingProducts,
    newLaunch,
    todaysDeals
  } = useSelector((state) => state.products);

  const location = useSelector((state) => state.location);
  const { storeId, address, coords } = location;
  const { isAuthenticated } = useSelector((state) => state.auth);
  const selectedSlot = useSelector((state) => state.config.selectedSlot);
  const { unreadCount } = useSelector((state) => state.notifications || { unreadCount: 0 });

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [flashSaleTimer, setFlashSaleTimer] = useState('');
  const [storeDetail, setStoreDetail] = useState(null);
  const [distance, setDistance] = useState(null);

  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  // Filter helper
  const filterBySlot = useCallback((products) => {
    if (!products) return [];
    if (!selectedSlot || selectedSlot === 'all') return products;

    const slotMap = {
      'tmrw_morning': ['morning', 'tomorrow morning', 'tmrw_morning'],
      'today_evening': ['afternoon', 'today evening', 'today_evening', 'evening'],
      'tmrw_evening': ['evening', 'tomorrow evening', 'tmrw_evening'],
      'express': ['express', 'express delivery']
    };
    const searchTerms = slotMap[selectedSlot] || [selectedSlot];

    return products.filter(p => {
      const hasVariants = p.variants && p.variants.length > 0;
      let supportsSlot = false;

      if (hasVariants) {
        // If product has customizations, treat each as a filter criteria
        // If ANY customization matches the slot, the product is shown
        supportsSlot = p.variants.some(v => {
          const vInfo = Array.isArray(v.delivery_info)
            ? v.delivery_info
            : (v.delivery_info ? v.delivery_info.split(',').map(s => s.trim().toLowerCase()) : []);

          return vInfo.some(info => searchTerms.includes(info.toLowerCase()));
        });
      } else {
        // No customizations - use product-level delivery options
        const options = p.delivery_options || ['express'];
        const normalizedOptions = options.map(o =>
          o === 'morning' ? 'tmrw_morning' :
            o === 'afternoon' ? 'today_evening' :
              o === 'evening' ? 'tmrw_evening' : o
        );
        supportsSlot = normalizedOptions.includes(selectedSlot);
      }

      if (!supportsSlot) return false;

      // Check stock availability based on slot type
      const isExpress = selectedSlot === 'express';
      return isExpress ? (p.express_stock_qty > 0) : (p.scheduled_stock_qty > 0);
    });
  }, [selectedSlot]);

  // Memoized Filtered Lists
  const filteredFlashSale = useMemo(() => filterBySlot(flashSale), [flashSale, filterBySlot]);
  const filteredDeals = useMemo(() => filterBySlot(todaysDeals), [todaysDeals, filterBySlot]);
  const filteredFrozen = useMemo(() => filterBySlot(frozenProducts), [frozenProducts, filterBySlot]);
  const filteredExclusive = useMemo(() => filterBySlot(exclusiveOffers), [exclusiveOffers, filterBySlot]);
  const filteredTrending = useMemo(() => filterBySlot(trendingProducts), [trendingProducts, filterBySlot]);
  const filteredNewLaunch = useMemo(() => filterBySlot(newLaunch), [newLaunch, filterBySlot]);
  const filteredFeatured = useMemo(() => filterBySlot(featuredProducts), [featuredProducts, filterBySlot]);

  const dynamicSections = useMemo(() => {
    if (!categorySections) return [];
    return categorySections.map(section => ({
      ...section,
      filteredProducts: filterBySlot(section.products || [])
    })).filter(section => section.filteredProducts && section.filteredProducts.length > 0);
  }, [categorySections, filterBySlot]);

  const filteredCategories = useMemo(() => {
    return categories || [];
  }, [categories]);

  // Distance Calculation Helper
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const loadData = useCallback(async (isCancelled = { current: false }) => {
    let currentStoreId = storeId;
    if (!currentStoreId && (location.pincode || location.coords)) {
      try {
        const params = {};
        if (location.coords) {
          params.lat = location.coords.lat;
          params.lng = location.coords.lng;
        } else if (location.pincode) {
          params.pincode = location.pincode;
        }
        const storeRes = await productService.findNearestStore(params);
        if (storeRes.success && storeRes.data) {
          currentStoreId = storeRes.data.id;
        }
      } catch (e) {
        console.error('Error finding nearest store:', e);
      }
    }

    if (!currentStoreId) return;

    try {
      if (!refreshing) dispatch(setLoading(true));
      const res = await productService.getHomeData(currentStoreId, selectedSlot);
      if (!isCancelled.current && res.success) {
        const { 
          banners, 
          categories,
          featuredProducts, 
          categorySections, 
          flashSale, 
          frozenProducts, 
          exclusiveOffers, 
          trendingProducts, 
          newLaunch, 
          todaysDeals 
        } = res.data;

        dispatch(setBanners(banners));
        dispatch(setCategories(categories || []));
        dispatch(setFeaturedProducts(featuredProducts));
        dispatch(setCategorySections(categorySections));
        dispatch(setHomeCollections({
          flashSale, frozenProducts, exclusiveOffers, trendingProducts, newLaunch, todaysDeals
        }));
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      if (!isCancelled.current) {
        dispatch(setLoading(false));
      }
    }
  }, [dispatch, storeId, location.pincode, location.coords, selectedSlot]);

  useEffect(() => {
    const isCancelled = { current: false };
    loadData(isCancelled);
    return () => { isCancelled.current = true; };
  }, [loadData]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const totalSeconds = Math.floor((midnight - now) / 1000);

      if (totalSeconds <= 0) {
        setFlashSaleTimer('00h 00m 00s');
      } else {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setFlashSaleTimer(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Store details logic
  useEffect(() => {
    const fetchStore = async () => {
      if (storeId) {
        try {
          const res = await productService.getStoreDetail(storeId);
          if (res.success) {
            setStoreDetail(res.data);
            if (res.data.latitude && res.data.longitude) {
              if (coords) {
                setDistance(getDistance(coords.lat, coords.lng, res.data.latitude, res.data.longitude));
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch store detail:', e);
        }
      }
    };
    fetchStore();
  }, [storeId, coords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return {
    loading,
    refreshing,
    onRefresh,
    banners,
    filteredCategories,
    dynamicSections,
    filteredFlashSale,
    filteredDeals,
    filteredFrozen,
    filteredExclusive,
    filteredTrending,
    filteredNewLaunch,
    filteredFeatured,
    flashSaleTimer,
    activeTheme,
    selectedSlot,
    unreadCount,
    location,
    address,
    isAuthenticated,
    storeDetail,
    distance,
    navigation
  };
};

export default useHomeData;
