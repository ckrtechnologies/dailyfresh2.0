import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { toggleFavorite, toggleFavoriteAsync, setFavorites, fetchFavoritesAsync } from '../store/slices/favoritesSlice';
import { addItem } from '../store/slices/cartSlice';
import favoritesService from '../api/favoritesService';

import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.favorites);
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    dispatch(fetchFavoritesAsync());
  }, [dispatch]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchFavoritesAsync()).unwrap();
    } catch (e) {
      console.warn('Error refreshing favorites:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const validItems = React.useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items
      .map(item => item?.product || item)
      .filter(p => p && p.id && p.name);
  }, [items]);

  const renderItem = ({ item }) => {
    const prod = item?.product || item;
    if (!prod || !prod.name) return null;
    return (
      <View style={styles.productWrapper}>
        <ProductCard
          product={prod}
          onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
        />
      </View>
    );
  };

  if (validItems.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: activeTheme.primary + '15' }]}>
            <Icon name="heart" size={48} color={activeTheme.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite fresh products here to find them easily later.
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: activeTheme.primary }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.itemCount}>{validItems.length} {validItems.length === 1 ? 'item' : 'items'}</Text>
      </View>
      <FlatList
        data={validItems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id || Math.random())}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  itemCount: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  list: {
    padding: 8,
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
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.white,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: SPACING.s,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl * 1.5,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: SPACING.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  shopText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default FavoritesScreen;
