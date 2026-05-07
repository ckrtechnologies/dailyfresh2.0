import React, { useState, useMemo, useCallback } from 'react';
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

  // Plain JS scroll progress (0 → 1 over first 80px of scroll).
  // Using plain state instead of Animated.Value avoids all _children freeze /
  // native-driver conflicts that arise when passing interpolations through props.
  const [scrollProgress, setScrollProgress] = useState(0);

  const onScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    setScrollProgress(Math.min(Math.max(y / 80, 0), 1));
  }, []);

  // Plain numbers — HomeHeader already does plain math on these props.
  const headerOpacity = 1 - scrollProgress;
  const headerHeight  = Math.max(50 * (1 - scrollProgress), 0);
  const progress      = scrollProgress;

  const headerColorValue = activeTheme.primary; 
  const searchMarginTop = 0;

  // FlatList sections
  const sections = useMemo(() => {
    const list = [
      { id: 'banners', type: 'banners' },
      { id: 'categories', type: 'categories' },
      { id: 'flash_sale', type: 'products', title: 'Flash Sale', data: filteredFlashSale, timer: flashSaleTimer, sectionType: 'flash_sale' },
      { id: 'deals', type: 'products', title: 'Todays Deals', data: filteredDeals, sectionType: 'deals' },
      { id: 'frozen', type: 'products', title: 'Frozen Products', data: filteredFrozen, sectionType: 'frozen' },
      { id: 'exclusive', type: 'products', title: 'Exclusive Offers', data: filteredExclusive, sectionType: 'exclusive' },
      { id: 'trending', type: 'products', title: 'Trending Products', data: filteredTrending, sectionType: 'trending' },
      { id: 'new_launch', type: 'products', title: 'New Launch', data: filteredNewLaunch, sectionType: 'new_launch' },
      { id: 'featured', type: 'products', title: 'Fresh Catch', data: filteredFeatured, sectionType: 'featured' },
    ];

    // Add dynamic category sections
    dynamicSections.forEach(section => {
      list.push({
        id: `section_${section.id}`,
        type: 'products',
        title: section.title,
        data: section.filteredProducts,
        sectionType: 'category',
        extraParams: { categoryId: section.id }
      });
    });

    list.push({ id: 'trust', type: 'trust' });
    
    return list.filter(s => s.type !== 'products' || (s.data && s.data.length > 0));
  }, [filteredFlashSale, filteredDeals, filteredFrozen, filteredExclusive, filteredTrending, filteredNewLaunch, filteredFeatured, dynamicSections, flashSaleTimer]);

  const renderSection = React.useCallback(({ item }) => {
    switch (item.type) {
      case 'banners':
        return <BannerSlider banners={banners} onBannerPress={(b) => navigation.navigate('ProductList', { title: b.title, type: 'banner', bannerId: b.id })} />;
      case 'categories':
        return <CategoryStrip 
          categories={filteredCategories} 
          activeTheme={activeTheme} 
          onCategoryPress={(c) => navigation.navigate('ProductList', { title: c.name, type: 'category', categoryId: c.id })}
          onViewAllPress={() => navigation.navigate('Categories')}
        />;
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
      case 'trust':
        return <TrustStrip activeTheme={activeTheme} />;
      default:
        return null;
    }
  }, [banners, filteredCategories, activeTheme, navigation]);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LogoLoader size={100} />
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
          onLocationPress={() => isAuthenticated ? navigation.navigate('SavedAddresses', { selectMode: true }) : navigation.navigate('LocationPicker')}
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

      {/* Not Serviceable Overlay */}
      {location.isHydrated && !location.isServiceable && (
        <View style={styles.unserviceableOverlay}>
          <View style={styles.unserviceableCard}>
            <View style={[styles.iconCircle, { backgroundColor: activeTheme.primary + '15' }]}>
              <Icon name="map-marker-radius-outline" size={48} color={activeTheme.primary} />
            </View>
            <Text style={styles.unserviceableTitle}>We're Coming Soon!</Text>
            <Text style={styles.unserviceableText}>
              Currently, we don't deliver fresh cuts to your neighborhood, but we're expanding rapidly. Stay tuned!
            </Text>
            <TouchableOpacity 
              style={[styles.changeLocBtn, { backgroundColor: activeTheme.primary }]}
              onPress={() => navigation.navigate('LocationPicker')}
            >
              <Text style={styles.changeLocBtnText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = {
  unserviceableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 2000,
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
