import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import ProductCard from '../components/ProductCard';
import productService from '../api/productService';
import ComingSoonScreen from './ComingSoonScreen';

const ProductListScreen = ({ route, navigation }) => {
  const { title, type, initialProducts, searchQuery, categoryId, subCategoryId } = route.params || {};
  const { storeId, isServiceable, pincode } = useSelector((state) => state.location);
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const [products, setProducts] = useState(initialProducts || []);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCatId, setSelectedSubCatId] = useState(subCategoryId || 'all');
  const [loading, setLoading] = useState(!initialProducts);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch subcategories if categoryId is provided
  useEffect(() => {
    let isMounted = true;
    if (categoryId) {
      productService.getSubCategories(categoryId).then((res) => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setSubCategories(res.data);
        }
      });
    }
    return () => { isMounted = false; };
  }, [categoryId]);

  // 2. Fetch products whenever category, subcategory, store, or slot changes
  const fetchProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!isServiceable || !storeId) {
        setProducts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const filters = { storeId, deliveryType: selectedSlot };
      if (searchQuery) filters.search = searchQuery;
      if (categoryId) filters.categoryId = categoryId;
      if (selectedSubCatId && selectedSubCatId !== 'all') {
        filters.subCategoryId = selectedSubCatId;
      }
      if (type === 'flash_sale') filters.isFlashSale = true;
      if (type === 'trending') filters.isTrending = true;
      if (type === 'deals') filters.isDeal = true;
      if (type === 'featured') filters.isFeatured = true;
      if (type === 'exclusive') filters.isExclusive = true;
      if (type === 'new_launch') filters.isNewLaunch = true;
      if (type === 'frozen') filters.isFrozen = true;

      const res = await productService.getProducts(filters);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, selectedSubCatId, storeId, selectedSlot, searchQuery, type]);

  useEffect(() => {
    if (!initialProducts || searchQuery || categoryId || selectedSubCatId !== 'all') {
      fetchProducts();
    }
  }, [fetchProducts]);

  const onRefresh = () => {
    fetchProducts(true);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: activeTheme.primary }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: COLORS.white }]}>{title || 'Products'}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderSubCategoryTabs = () => {
    if (!subCategories || subCategories.length === 0) return null;

    return (
      <View style={styles.subCatContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subCatScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.subCatPill,
              selectedSubCatId === 'all' && [styles.subCatPillActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]
            ]}
            onPress={() => setSelectedSubCatId('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.subCatPillText, selectedSubCatId === 'all' && styles.subCatPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {subCategories.map((sub) => {
            const isActive = selectedSubCatId === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.subCatPill,
                  isActive && [styles.subCatPillActive, { backgroundColor: activeTheme.primary, borderColor: activeTheme.primary }]
                ]}
                onPress={() => setSelectedSubCatId(sub.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subCatPillText, isActive && styles.subCatPillTextActive]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (!isServiceable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.background }]} edges={['bottom', 'left', 'right']}>
        <StatusBar 
          backgroundColor={activeTheme.primary} 
          barStyle="light-content"
        />
        {renderHeader()}
        <ComingSoonScreen pincode={pincode} />
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.background }]} edges={['bottom', 'left', 'right']}>
      <StatusBar 
        backgroundColor={activeTheme.primary} 
        barStyle="light-content"
      />
      {renderHeader()}
      {renderSubCategoryTabs()}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={10}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
        }
        renderItem={({ item }) => (
          <View style={styles.productWrapper}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="basket-off-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No products found in this section.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    marginLeft: SPACING.s,
  },
  subCatContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  subCatScrollContent: {
    paddingHorizontal: SPACING.m,
    alignItems: 'center',
  },
  subCatPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subCatPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subCatPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  subCatPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: SPACING.m,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  productWrapper: {
    width: '50%',
    padding: 6,
    display: 'flex',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    marginTop: SPACING.m,
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProductListScreen;
