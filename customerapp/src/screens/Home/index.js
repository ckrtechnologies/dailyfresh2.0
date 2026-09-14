import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StatusBar, 
  Modal, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Sub-components
import HomeHeader from './HomeHeader';
import HomeSearch from './HomeSearch';
import BannerSlider from './BannerSlider';
import CategoryStrip from './CategoryStrip';
import ProductSection from './ProductSection';
import TrustStrip from './TrustStrip';
import ComingSoonScreen from '../ComingSoonScreen';

// Constants & Tools
import { COLORS, THEMES } from '../../constants/theme';
import LogoLoader from '../../components/LogoLoader';
import useHomeData from './useHomeData';

const HomeScreen = () => {
  const {
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
  } = useHomeData();

  // Scroll offset tracking
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    let timeout;
    if (loading && !refreshing) {
      timeout = setTimeout(() => {
        setShowRecovery(true);
      }, 4000);
    } else {
      setShowRecovery(false);
    }
    return () => clearTimeout(timeout);
  }, [loading, refreshing]);

  const onScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    setScrollProgress(Math.min(Math.max(y / 80, 0), 1));
  }, []);

  // Keep HomeHeader permanently visible so location and delivery mode switchers never disappear
  const headerOpacity = 1;
  const headerHeight  = 56;
  const progress      = scrollProgress;

  const headerColorValue = activeTheme.primary; 
  const searchMarginTop = 0;

  // FlatList sections
  const sections = useMemo(() => {
    if (!location.isServiceable) return [];
    const list = [];
    if (banners && banners.length > 0) {
      list.push({ type: 'banners', id: 'banners' });
    }
    if (filteredCategories && filteredCategories.length > 0) {
      list.push({ type: 'categories', id: 'categories' });
    }

    if (filteredFlashSale && filteredFlashSale.length > 0) {
      list.push({ type: 'products', id: 'flashSale', title: '⚡ Flash Sale', data: filteredFlashSale, timer: flashSaleTimer, sectionType: 'flash_sale', extraParams: { is_flash_sale: true } });
    }
    if (filteredDeals && filteredDeals.length > 0) {
      list.push({ type: 'products', id: 'todaysDeals', title: '🏷️ Today\'s Deals', data: filteredDeals, sectionType: 'deals', extraParams: { is_deal: true } });
    }
    if (filteredFrozen && filteredFrozen.length > 0) {
      list.push({ type: 'products', id: 'frozen', title: '❄️ Frozen Delights', data: filteredFrozen, sectionType: 'frozen', extraParams: { is_frozen: true } });
    }
    if (filteredExclusive && filteredExclusive.length > 0) {
      list.push({ type: 'products', id: 'exclusive', title: '✨ Exclusive Offers', data: filteredExclusive, sectionType: 'exclusive', extraParams: { is_exclusive: true } });
    }
    if (filteredTrending && filteredTrending.length > 0) {
      list.push({ type: 'products', id: 'trending', title: '🔥 Trending Products', data: filteredTrending, sectionType: 'trending', extraParams: { is_trending: true } });
    }
    if (filteredNewLaunch && filteredNewLaunch.length > 0) {
      list.push({ type: 'products', id: 'newLaunch', title: '🚀 New Launches', data: filteredNewLaunch, sectionType: 'new_launch', extraParams: { is_new_launch: true } });
    }
    if (filteredFeatured && filteredFeatured.length > 0) {
      list.push({ type: 'products', id: 'featured', title: '🌟 Featured Products', data: filteredFeatured, sectionType: 'featured', extraParams: { is_featured: true } });
    }

    if (dynamicSections && dynamicSections.length > 0) {
      dynamicSections.forEach(s => {
        list.push({
          type: 'products',
          id: `sec_${s.id}`,
          title: s.name || s.title || 'Products',
          data: s.filteredProducts,
          sectionType: 'category',
          extraParams: { sub_category_id: s.id }
        });
      });
    }

    if (list.length === 0 && !loading) {
      list.push({ type: 'empty_store', id: 'empty_store' });
    }

    list.push({ type: 'trust', id: 'trust' });
    return list;
  }, [
    banners,
    filteredCategories,
    filteredFlashSale,
    filteredDeals,
    filteredFrozen,
    filteredExclusive,
    filteredTrending,
    filteredNewLaunch,
    filteredFeatured,
    dynamicSections,
    flashSaleTimer,
    loading,
    location.isServiceable
  ]);

  const renderSection = useCallback(({ item }) => {
    switch (item.type) {
      case 'banners':
        return <BannerSlider banners={banners} activeTheme={activeTheme} />;
      case 'categories':
        return (
          <CategoryStrip 
            categories={filteredCategories} 
            activeTheme={activeTheme} 
            navigation={navigation}
            onCategoryPress={(cat) => navigation.navigate('ProductList', { categoryId: cat.id, title: cat.name })}
            onViewAllPress={() => navigation.navigate('Categories')}
          />
        );
      case 'products':
        return <ProductSection 
          title={item.title} 
          products={item.data} 
          activeTheme={activeTheme} 
          navigation={navigation} 
          timer={item.timer} 
          type={item.sectionType}
          extraParams={item.extraParams}
        />;
      case 'empty_store':
        return (
          <View style={{ padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name="store-off-outline" size={40} color="#94a3b8" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 8 }}>
              No Products Available
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 }}>
              There are currently no items in stock for this delivery slot at your location. Please try switching your delivery slot or choosing another delivery address.
            </Text>
            <TouchableOpacity
              onPress={() => isAuthenticated ? navigation.navigate('SavedAddresses', { selectMode: true }) : navigation.navigate('LocationPicker', { changeLocation: true })}
              style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: activeTheme.primary || COLORS.primary, borderRadius: 10 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Change Location</Text>
            </TouchableOpacity>
          </View>
        );
      case 'trust':
        return <TrustStrip activeTheme={activeTheme} />;
      default:
        return null;
    }
  }, [banners, filteredCategories, activeTheme, navigation, hasAnyProducts, isAuthenticated]);

  const hasCachedContent = location.isServiceable && ((banners && banners.length > 0) || hasAnyProducts);

  if (loading && !refreshing && !hasCachedContent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <LogoLoader size={90} />
        {showRecovery ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 6 }}>
              Taking longer than usual...
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 18, maxWidth: 280 }}>
              Connecting to the nearest store. You can retry or switch your delivery location.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowRecovery(false);
                  onRefresh();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: activeTheme.primary || COLORS.primary, borderRadius: 8 }}
              >
                <Icon name="refresh" size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Retry Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('LocationPicker', { changeLocation: true })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}
              >
                <Icon name="map-marker" size={18} color="#475569" />
                <Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>Change Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ marginTop: 16, fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>
            Loading freshest picks...
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <StatusBar backgroundColor={activeTheme.primary} barStyle="light-content" translucent />
      
      {/* Absolute Header - Still sticky at top */}
      <View style={{ zIndex: 1000 }}>
        <HomeHeader 
          location={location}
          address={address}
          selectedSlot={selectedSlot}
          unreadCount={unreadCount}
          activeTheme={activeTheme}
          headerColor={headerColorValue}
          progress={progress}
          headerHeight={headerHeight}
          headerOpacity={headerOpacity}
          onLocationPress={() => isAuthenticated ? navigation.navigate('SavedAddresses', { selectMode: true }) : navigation.navigate('LocationPicker', { changeLocation: true })}
          onSlotPress={() => navigation.navigate('DeliveryMode')}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
        <HomeSearch 
          activeTheme={activeTheme} 
          onSearchPress={() => navigation.navigate('Search')}
          headerColor={headerColorValue}
          progress={progress}
          marginTop={searchMarginTop}
        />
      </View>

      {!location.isServiceable ? (
        <ComingSoonScreen pincode={location.pincode} showHeader={false} />
      ) : (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
          }
          removeClippedSubviews={true}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
        />
      )}
    </View>
  );
};

const styles = {
  unserviceableContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unserviceableCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  unserviceableTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  unserviceableText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  changeLocBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  changeLocBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
};

export default HomeScreen;
