import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../constants/theme';
import productService from '../api/productService';
import ProductCard from '../components/ProductCard';

const ProductListingScreen = ({ route, navigation }) => {
  const { categoryId, categoryName, subCategoryId } = route.params || {};
  const { storeId } = useSelector((state) => state.location);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const response = await productService.getProducts({
      categoryId,
      subCategoryId,
      storeId
    });
    if (response.success) {
      setProducts(response.data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [categoryId, subCategoryId, storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    fetchProducts(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color={COLORS.dark} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{categoryName || 'Products'}</Text>
        <Text style={styles.subtitle}>{products.length} Items</Text>
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <Icon name="tune-variant" size={24} color={COLORS.dark} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productWrapper}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="basket-remove-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No products found in this category</Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.s,
  },
  titleContainer: {
    flex: 1,
    marginLeft: SPACING.s,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  filterButton: {
    padding: SPACING.s,
  },
  listContent: {
    padding: SPACING.m,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: SPACING.m,
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProductListingScreen;
