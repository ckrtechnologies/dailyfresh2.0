import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import productService from '../api/productService';
import { setCategories } from '../store/slices/productSlice';
import ComingSoonScreen from './ComingSoonScreen';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - SPACING.l * 2 - SPACING.m * 2) / 3;

const CategoriesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.products);
  const { selectedSlot } = useSelector((state) => state.config);
  const location = useSelector((state) => state.location);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const [refreshing, setRefreshing] = useState(false);

  // Guard: show ComingSoonScreen if location not serviceable
  if (location.isHydrated && !location.isServiceable) {
    return <ComingSoonScreen pincode={location.pincode} />;
  }

  React.useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await productService.getCategories(location.storeId, selectedSlot);
        if (isMounted && res.success && res.data) {
          dispatch(setCategories(res.data));
        }
      } catch (e) {
        console.warn('Error fetching categories:', e);
      }
    };
    if (location.storeId) {
      fetchCats();
    }
    return () => { isMounted = false; };
  }, [location.storeId, selectedSlot, dispatch]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await productService.getCategories(location.storeId, selectedSlot);
      if (res.success && res.data) {
        dispatch(setCategories(res.data));
      }
    } catch (e) {
      console.warn('Error refreshing categories:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const renderCategoryItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigation.navigate('ProductList', { categoryId: item.id, title: item.name })}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image_url || item.imageUrl || 'https://via.placeholder.com/100' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: activeTheme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={30} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: COLORS.white }]}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories found</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.s,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  categoryCard: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    marginBottom: SPACING.s,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
  },
});

export default CategoriesScreen;

