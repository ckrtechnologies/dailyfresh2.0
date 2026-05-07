import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { toggleFavorite, toggleFavoriteAsync, setFavorites, fetchFavoritesAsync } from '../store/slices/favoritesSlice';
import { addItem } from '../store/slices/cartSlice';
import favoritesService from '../api/favoritesService';

const { width } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.favorites);

  React.useEffect(() => {
    dispatch(fetchFavoritesAsync());
  }, [dispatch]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => {
          dispatch(toggleFavorite(item));
          dispatch(toggleFavoriteAsync(item));
        }}
      >
        <Icon name="heart" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.weight}>{item.weight}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => dispatch(addItem(item))}
          >
            <Text style={styles.addText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="heart-outline" size={80} color={COLORS.gray} />
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Save your favorite fresh products here to find them easily later.
        </Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
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
    padding: SPACING.m,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: (width - SPACING.m * 3) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginBottom: SPACING.m,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  info: {
    padding: SPACING.s,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  weight: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.s,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  addText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
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
    marginTop: SPACING.l,
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.button,
    marginTop: SPACING.xl,
  },
  shopText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default FavoritesScreen;
