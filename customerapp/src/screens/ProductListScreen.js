import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import ProductCard from '../components/ProductCard';
import productService from '../api/productService';

const ProductListScreen = ({ route, navigation }) => {
  const { title, type, initialProducts, searchQuery, categoryId, subCategoryId } = route.params;
  const { storeId } = useSelector((state) => state.location);
  const { selectedSlot } = useSelector((state) => state.config);
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  const filteredProducts = products.filter(p => 
    selectedSlot === 'all' || 
    p.delivery_options?.includes(selectedSlot) || 
    (!p.delivery_options && selectedSlot === 'express')
  );

  useEffect(() => {
    if (!initialProducts || searchQuery || categoryId || subCategoryId) {
      fetchProducts();
    }
  }, [searchQuery, categoryId, subCategoryId, storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filters = { storeId };
      if (searchQuery) filters.search = searchQuery;
      if (categoryId) filters.categoryId = categoryId;
      if (subCategoryId) filters.subCategoryId = subCategoryId;
      if (type === 'flash_sale') filters.isFlashSale = true;
      if (type === 'trending') filters.isTrending = true;
      if (type === 'deals') filters.isDeal = true;

      const res = await productService.getProducts(filters);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.filterBtn}>
        <Icon name="tune-variant" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  filterBtn: {
    padding: SPACING.s,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    borderRadius: 8,
  },
  listContent: {
    padding: SPACING.s,
  },
  productWrapper: {
    flex: 0.5,
    padding: SPACING.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    marginTop: 100,
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
