import React, { useRef, useState, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StatusBar, 
  Animated, 
  Modal, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl 
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

  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        setScrollOffset(event.nativeEvent.contentOffset.y);
      }
    }
  ), [scrollY]);

  // Header background logic
  // Starts solid to avoid "light" look, then stays solid. 
  // If user wants fade-to-solid, we use Math.min(scrollOffset / 50, 1)
  // But user said it's "light" at top and "corrects" later, meaning they want it SOLID.
  const headerColorValue = activeTheme.primary; 

  // Shrink calculations (0 to 80px scroll range)
  const progress = Math.min(scrollOffset / 80, 1);
  const headerHeight = 50 * (1 - progress); // Shrinks from 50 to 0
  const headerOpacity = 1 - progress;
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

  const renderSection = ({ item }) => {
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
  };

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
                  <View style={styles.detailRow}><Icon name="phone" size={20} color={activeTheme.primary} /><Text style={styles.detailValue}>{storeDetail.phone || 'N/A'}</Text></View>
                  <View style={styles.detailRow}><Icon name="email" size={20} color={activeTheme.primary} /><Text style={styles.detailValue}>{storeDetail.email || 'N/A'}</Text></View>
                  <View style={styles.detailRow}><Icon name="map-marker-outline" size={20} color={activeTheme.primary} /><Text style={styles.detailValue}>{storeDetail.address || 'Kolkata, WB'}</Text></View>
                </View>
              </View>
            </ScrollView>
          ) : <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 50 }} />}
        </View>
      </View>
    </Modal>
  );

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

      <Animated.FlatList
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
      
      {renderStoreModal()}
    </View>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  storeDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
  },
  storeDetailImage: {
    width: '100%',
    height: 180,
  },
  storeDetailInfo: {
    padding: 16,
  },
  storeDetailName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  storeDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 4,
  },
  storeDistanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
};

export default HomeScreen;
