import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import {
  setCategories,
  setBanners,
  setHomeCollections,
  setFeaturedProducts,
  setCategorySections,
  setLoading
} from '../store/slices/productSlice';
import productService from '../api/productService';
import ProductCard from '../components/ProductCard';
import LogoLoader from '../components/LogoLoader';

const { width } = Dimensions.get('window');
const BANNER_ITEM_GAP = 12;
const BANNER_WIDTH = width * 0.88; // 88% wide — 12% peeks through on right
const BANNER_SNAP = BANNER_WIDTH + BANNER_ITEM_GAP;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { address, storeId } = useSelector((state) => state.location);

  const totalHeaderHeight = 120;
  // Header Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [120, 60],
    extrapolate: 'clamp',
  });

  const headerColor = COLORS.primary;

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

  const location = useSelector((state) => state.location);

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

  const loadData = async () => {
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
        productService.getCategories(),
        productService.getBanners(),
        productService.getProducts({ isFeatured: true, storeId }),
        productService.getProducts({ isFlashSale: true, storeId }),
        productService.getProducts({ isTrending: true, storeId }),
        productService.getProducts({ isNewLaunch: true, storeId }),
        productService.getProducts({ isFrozen: true, storeId }),
        productService.getProducts({ isExclusive: true, storeId }),
        productService.getProducts({ isDeal: true, storeId }),
      ]);

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
            const prodRes = await productService.getProducts({ categoryId: cat.id, storeId });
            return {
              id: cat.id,
              title: cat.name,
              products: prodRes.success ? prodRes.data : []
            };
          })
        );
        dispatch(setCategorySections(categoryData.filter(c => c.products.length > 0)));
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch, storeId]);

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
      <Animated.View style={[
        styles.headerTop,
        {
          opacity: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          }),
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [0, 80],
              outputRange: [0, -40],
              extrapolate: 'clamp',
            })
          }]
        }
      ]}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => navigation.navigate('LocationPicker')}
        >
          <View style={styles.locationIcon}>
            <Icon name="map-marker-radius" size={24} color={COLORS.white} />
          </View>
          <View style={styles.locationTextContainer}>
            <View style={styles.locationTitleRow}>
               <Text style={styles.locationTitle} numberOfLines={2}>
                {address || 'Select Location'}
              </Text>
              <Icon name="chevron-down" size={16} color={COLORS.white} style={{ marginTop: 2 }} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {location.storeName && (
            <View style={styles.storeBadge}>
              <Icon name="storefront-outline" size={14} color={COLORS.white} />
              <Text style={styles.storeNameText} numberOfLines={1}>{location.storeName}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="shopping-outline" size={26} color={COLORS.white} />
            {totalCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.badgeText}>{totalCount}</Text>
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
          <Icon name="magnify" size={24} color={COLORS.gray} />

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

  const renderProductSection = (title, data, timer = null, type = 'all', extraParams = {}) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.flashSaleTitleRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
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
              <Text style={styles.viewAll}>View All</Text>
              <Icon name="arrow-right-circle-outline" size={20} color={COLORS.primary} />
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
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.viewAll}>View All</Text>
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

  const renderReferFriend = () => (
    <TouchableOpacity style={styles.referContainer} onPress={() => navigation.navigate('Referrals')}>
      <View style={styles.referContent}>
        <View style={styles.referTextContainer}>
          <View style={styles.referTitleRow}>
             <Icon name="gift-outline" size={24} color="#4338CA" style={{ marginRight: 8 }} />
             <Text style={styles.referTitle}>Refer & Earn</Text>
          </View>
          <Text style={styles.referSubtitle}>Get ₹100 for every friend you refer!</Text>
        </View>
        <View style={styles.referBadge}>
          <Text style={styles.referBadgeText}>INVITE NOW</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LogoLoader size={120} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {renderHeader()}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={{ height: 120 }} />
        {renderBanners()}
        {renderProductSection('Flash Sale', flashSale, flashSaleTimer, 'flash_sale')}
        {renderProductSection('Todays Deals', todaysDeals, null, 'deals')}
        {renderProductSection('Frozen Products', frozenProducts, null, 'frozen')}
        {renderProductSection('Exclusive Offers', exclusiveOffers, null, 'exclusive')}
        {renderProductSection('Trending Products', trendingProducts, null, 'trending')}
        {renderProductSection('New Launch', newLaunch, null, 'new_launch')}
        {renderProductSection('Fresh Catch', featuredProducts, null, 'featured')}
        {renderCategories()}
        
        {/* Dynamic Category Sections */}
        {categorySections.map((section) => (
          <React.Fragment key={section.id}>
            {renderProductSection(section.title, section.products, null, 'category', { categoryId: section.id })}
          </React.Fragment>
        ))}

        {renderReferFriend()}

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Icon name="check-decagram" size={28} color={COLORS.primary} />
            <Text style={styles.trustText}>100% Fresh</Text>
          </View>
          <View style={styles.trustItem}>
            <Icon name="shield-check" size={28} color={COLORS.primary} />
            <Text style={styles.trustText}>Chemical-Free</Text>
          </View>
          <View style={styles.trustItem}>
            <Icon name="truck-delivery" size={28} color={COLORS.primary} />
            <Text style={styles.trustText}>Fast Delivery</Text>
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: SPACING.s,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: 4,
  },
  address: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  cartButton: {
    padding: SPACING.s,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.m,
    height: 44,
    borderRadius: RADIUS.button,
    marginTop: SPACING.s,
  },
  searchText: {
    marginLeft: SPACING.s,
    color: COLORS.gray,
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  flashSaleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginRight: 6,
  },
  categoryList: {
    paddingLeft: SPACING.l,
  },
  categoryConsistantCard: {
    width: 120,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginRight: SPACING.m,
    overflow: 'hidden',
  },
  categoryImageWrapper: {
    width: '100%',
    height: 90,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  categoryInfo: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
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
  referContainer: {
    backgroundColor: '#EEF2FF',
    marginHorizontal: SPACING.l,
    marginVertical: SPACING.xl,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  referContent: {
    flex: 1,
  },
  referTextContainer: {
    marginBottom: SPACING.m,
  },
  referTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  referTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4338CA',
  },
  referSubtitle: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 2,
  },
  referBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: SPACING.m,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  referBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  referImage: {
    width: 80,
    height: 80,
    marginLeft: SPACING.m,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 120,
  },
  storeNameText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default HomeScreen;

