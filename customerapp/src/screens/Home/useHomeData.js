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
  setHomeCollections,
  clearProducts
} from '../../store/slices/productSlice';
import { THEMES } from '../../constants/theme';
import { setServiceability } from '../../store/slices/locationSlice';

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
  const unreadCount = useSelector((state) => state.notifications?.unreadCount || 0);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [flashSaleTimer, setFlashSaleTimer] = useState('');
  const [storeDetail, setStoreDetail] = useState(null);
  const [distance, setDistance] = useState(null);

  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  // Filter helper
  // Filter helper
  const filterBySlot = useCallback((products) => {
    if (!products || !Array.isArray(products)) return [];
    if (!selectedSlot || selectedSlot === 'all') return products;

    const isTomorrow = ['tomorrow', 'tomorrow_morning', 'tomorrow_evening'].includes(selectedSlot);
    const isExpress = selectedSlot === 'express';

    return products.filter(p => {
      const hasVariants = p.variants && p.variants.length > 0;
      let supportsSlot = false;
      const options = p.delivery_options || p.deliveryOptions || [];
      const productSupportsExpress = options.includes('express');
      const productSupportsTomorrow = options.includes('tomorrow_morning') || options.includes('tomorrow_evening') || options.includes('tomorrow');

      if (hasVariants) {
        supportsSlot = p.variants.some(v => {
          const vInfo = Array.isArray(v.delivery_info)
            ? v.delivery_info
            : (Array.isArray(v.deliveryInfo)
              ? v.deliveryInfo
              : (v.delivery_info || v.deliveryInfo ? String(v.delivery_info || v.deliveryInfo).split(',').map(s => s.trim().toLowerCase()) : []));

          if (isExpress) {
            return vInfo.some(info => info.includes('express')) || productSupportsExpress;
          }
          if (isTomorrow) {
            return vInfo.some(info => info.includes('morning') || info.includes('evening') || info.includes('tomorrow')) || productSupportsTomorrow;
          }
          return true;
        });
      } else {
        if (isExpress) {
          supportsSlot = productSupportsExpress;
        } else if (isTomorrow) {
          supportsSlot = productSupportsTomorrow;
        } else {
          supportsSlot = options.includes(selectedSlot);
        }
      }

      if (!supportsSlot) return false;

      const expressStock = Number(p.express_stock_qty ?? p.expressStockQty ?? 0);
      const scheduledStock = Number(p.scheduled_stock_qty ?? p.scheduledStockQty ?? 0);

      if (isExpress) {
        return expressStock > 0;
      }
      if (isTomorrow) {
        return scheduledStock > 0;
      }
      return expressStock > 0 || scheduledStock > 0;
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

  const hasAnyProducts = useMemo(() => {
    return (
      (filteredFlashSale && filteredFlashSale.length > 0) ||
      (filteredDeals && filteredDeals.length > 0) ||
      (filteredFrozen && filteredFrozen.length > 0) ||
      (filteredExclusive && filteredExclusive.length > 0) ||
      (filteredTrending && filteredTrending.length > 0) ||
      (filteredNewLaunch && filteredNewLaunch.length > 0) ||
      (filteredFeatured && filteredFeatured.length > 0) ||
      (dynamicSections && dynamicSections.length > 0)
    );
  }, [filteredFlashSale, filteredDeals, filteredFrozen, filteredExclusive, filteredTrending, filteredNewLaunch, filteredFeatured, dynamicSections]);

  const filteredCategories = useMemo(() => {
    if (!hasAnyProducts || !categories || categories.length === 0) return [];
    if (dynamicSections && dynamicSections.length > 0) {
      const activeCatIds = new Set(dynamicSections.map(s => s.id));
      return categories.filter(c => activeCatIds.has(c.id));
    }
    return [];
  }, [hasAnyProducts, categories, dynamicSections]);

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
    let resolvedStoreId = location.storeId || storeId;
    let resolvedIsServiceable = location.isServiceable;

    // Always re-validate serviceability with backend.
    // Never trust storeId from Redux alone — it may be stale from a previous address.
    try {
      const params = {};
      if (location.pincode) {
        // Pincode takes absolute priority — send it alone without GPS so backend
        // cannot fall through to GPS-radius matching for a different city.
        params.pincode = location.pincode;
      } else if (location.coords) {
        // Only use GPS when no pincode is available
        params.lat = location.coords.lat;
        params.lng = location.coords.lng;
      }

      if (Object.keys(params).length > 0) {
        const storeRes = await productService.findNearestStore(params);
        if (storeRes.success && storeRes.data) {
          const isDeliverable = storeRes.data.is_deliverable === true;
          const storeObj = storeRes.data.store || null;
          resolvedIsServiceable = isDeliverable;
          resolvedStoreId = isDeliverable && storeObj ? storeObj.id : null;

          if (location.isServiceable !== isDeliverable || (location.storeId || storeId) !== resolvedStoreId) {
            dispatch(setServiceability({
              isServiceable: isDeliverable,
              storeId: resolvedStoreId,
              storeName: isDeliverable && storeObj ? storeObj.name : null,
            }));
          }

          if (!isDeliverable) {
            dispatch(clearProducts());
            if (!refreshing) dispatch(setLoading(false));
            return;
          }
        }
      }
    } catch (e) {
      console.error('Error validating serviceability:', e);
    }

    if (!resolvedIsServiceable && (location.isHydrated || location.pincode || location.address)) {
      dispatch(clearProducts());
      if (!refreshing) dispatch(setLoading(false));
      return;
    }

    // Fallback to flagship store only for cold startup when serviceability is still pending
    let currentStoreId = resolvedStoreId || storeId || 'bdd5ba57-6d11-4f7d-aec9-73378b01675e';

    try {
      if (!refreshing) dispatch(setLoading(true));
      const res = await productService.getHomeData(currentStoreId, selectedSlot);
      if (!isCancelled.current && res.success && res.data) {
        const banners = res.data.banners || [];
        const categories = res.data.categories || [];
        const featuredProducts = res.data.featuredProducts || res.data.featured_products || [];
        const categorySections = res.data.categorySections || res.data.category_sections || res.data.sections || [];
        const flashSale = res.data.flashSale || res.data.flash_sale || [];
        const frozenProducts = res.data.frozenProducts || res.data.frozen_products || [];
        const exclusiveOffers = res.data.exclusiveOffers || res.data.exclusive_offers || [];
        const trendingProducts = res.data.trendingProducts || res.data.trending_products || [];
        const newLaunch = res.data.newLaunch || res.data.new_launch || [];
        const todaysDeals = res.data.todaysDeals || res.data.todays_deals || [];

        dispatch(setBanners(banners));
        dispatch(setCategories(categories));
        dispatch(setFeaturedProducts(featuredProducts));
        dispatch(setCategorySections(categorySections));
        dispatch(setHomeCollections({
          flashSale, frozenProducts, exclusiveOffers, trendingProducts, newLaunch, todaysDeals
        }));
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, storeId, location.pincode, location.coords?.lat, location.coords?.lng, location.selectedAddress?.id, selectedSlot, refreshing]);

  useEffect(() => {
    const isCancelled = { current: false };
    loadData(isCancelled);
    return () => { isCancelled.current = true; };
  }, [loadData]);

  // Watchdog recovery timer: Never let the screen remain stuck on loading for > 5s
  useEffect(() => {
    let timeout;
    if (loading) {
      timeout = setTimeout(() => {
        console.warn('[useHomeData] Watchdog timeout triggered: forcing loading to false');
        dispatch(setLoading(false));
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [loading, dispatch]);

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
            if (res.data.latitude && res.data.longitude && coords) {
              const dist = getDistance(coords.lat, coords.lng, res.data.latitude, res.data.longitude);
              setDistance(dist);
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
    hasAnyProducts,
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
