import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, THEMES, SPACING, RADIUS } from '../constants/theme';
import { addItem, removeItem } from '../store/slices/cartSlice';
import { toggleFavorite, toggleFavoriteAsync } from '../store/slices/favoritesSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 2 - SPACING.m) / 2;


const ProductCard = React.memo(({ product, onPress, horizontal = false, size = 'small' }) => {
  const dispatch = useDispatch();

  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -4,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1500)
      ])
    ).start();
  }, [shimmerAnim, bounceAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 140],
  });

  // Use more granular selectors to avoid re-renders when other parts of state change
  const isFavorite = useSelector((state) =>
    state.favorites.items.some(item => item.id === product.id)
  );

  const cartItem = useSelector((state) =>
    state.cart.items.find(item => item.id === product.id)
  );

  const selectedSlot = useSelector((state) => state.config.selectedSlot);
  const isServiceable = useSelector((state) => state.location.isServiceable);

  const quantity = cartItem ? cartItem.quantity : 0;
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const {
    name,
    image_url,
    price,
    discount_price,
    weight_unit,
  } = product;

  const sellingPrice = discount_price || price;
  const hasDiscount = discount_price && discount_price < price;
  const discountPercentage = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0;

  const handleAddToCart = () => {
    const hasCustomization = (product.cut_options?.length > 0) ||
      (product.cleaning_options?.length > 0) ||
      (product.variants?.length > 0);

    if (hasCustomization && onPress) {
      onPress();
      return;
    }

    dispatch(addItem({
      product: { ...product, price: sellingPrice },
      quantity: 1
    }));
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(product));
    dispatch(toggleFavoriteAsync(product));
  };

  const handleRemove = () => {
    dispatch(removeItem(product.id));
  };

  const isTall = size === 'tall';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        horizontal && styles.horizontalContainer,
        isTall ? styles.tallCard : styles.smallCard
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, isTall && styles.tallImageContainer]}>
        <Image
          source={{ uri: image_url || 'https://via.placeholder.com/150' }}
          style={styles.image}
          resizeMode="cover"
        />
        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.heartButton}
          onPress={handleToggleFavorite}
        >
          <Icon
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? activeTheme.primary : activeTheme.textLight}
          />
        </TouchableOpacity>

        {isTall && (
          !isServiceable ? (
            <View style={[styles.floatingAddButton, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.addButtonText, { color: '#9CA3AF', fontSize: 10 }]}>UNAVAILABLE</Text>
            </View>
          ) : quantity > 0 ? (
            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleRemove}>
                <Icon name="minus" size={18} color={activeTheme.primary} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: activeTheme.primary }]}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleAddToCart}>
                <Icon name="plus" size={18} color={activeTheme.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.floatingAddButton, { borderColor: activeTheme.primary }]}
              onPress={handleAddToCart}
            >
              <Text style={[styles.addButtonText, { color: activeTheme.primary }]}>ADD</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.weight, { color: activeTheme.textLight }]}>{weight_unit || '500g pack'}</Text>
        <Text style={[styles.name, { color: activeTheme.text }]} numberOfLines={isTall ? 2 : 1}>
          {name}
        </Text>

        <View style={styles.deliveryOptionsContainer}>
          <View style={styles.scooterWrapper}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <Icon name="moped" size={18} color={activeTheme.primary} />
            </Animated.View>
          </View>

          <View style={styles.badgesColumn}>
            {/* Express badge */}
            {(product.delivery_options || []).includes('express') &&
             product.express_stock_qty > 0 && (
              <View style={[styles.deliveryBadge, { backgroundColor: '#F59E0B', borderColor: '#F59E0B', overflow: 'hidden' }]}>
                <Icon name="flash" size={10} color={COLORS.white} />
                <Text style={[styles.deliveryBadgeText, { color: COLORS.white }]}>Express</Text>
                <Animated.View
                  style={[styles.glitter, { transform: [{ skewX: '-20deg' }, { translateX: shimmerTranslateX }] }]}
                />
              </View>
            )}

            {/* Tomorrow badge */}
            {((product.delivery_options || []).includes('tomorrow_morning') ||
              (product.delivery_options || []).includes('tomorrow_evening')) &&
             product.scheduled_stock_qty > 0 && (
              <View style={[styles.deliveryBadge, { backgroundColor: '#10B981', borderColor: '#10B981', overflow: 'hidden' }]}>
                <Icon name="calendar-clock" size={10} color={COLORS.white} />
                <Text style={[styles.deliveryBadgeText, { color: COLORS.white }]}>Tomorrow</Text>
                <Animated.View
                  style={[styles.glitter, { transform: [{ skewX: '-20deg' }, { translateX: shimmerTranslateX }] }]}
                />
              </View>
            )}
          </View>
        </View>

        {!(product.variants?.length > 0) && (
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: activeTheme.text }]}>₹{sellingPrice}</Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: activeTheme.textLight }]}>₹{price}</Text>
            )}
          </View>
        )}

        {!isTall && (
          <View style={styles.smallCardFooter}>
            {!isServiceable ? (
              <View style={[styles.smallAddBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }]}>
                <Text style={[styles.smallAddBtnText, { color: '#9CA3AF' }]}>SERVICE UNAVAILABLE</Text>
              </View>
            ) : quantity > 0 ? (
              <View style={[styles.inlineQtySelector, { backgroundColor: activeTheme.primary }]}>
                <TouchableOpacity style={styles.inlineQtyBtn} onPress={handleRemove}>
                  <Icon name="minus" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.inlineQtyText}>{quantity}</Text>
                <TouchableOpacity style={styles.inlineQtyBtn} onPress={handleAddToCart}>
                  <Icon name="plus" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              !((selectedSlot === 'express' ? product.express_stock_qty : product.scheduled_stock_qty) > 0) ? (
                <View style={[styles.smallAddBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }]}>
                  <Text style={[styles.smallAddBtnText, { color: '#9CA3AF' }]}>OUT OF STOCK</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: activeTheme.primary }]}
                  onPress={handleAddToCart}
                >
                  <Text style={styles.smallAddBtnText}>ADD TO CART</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginBottom: SPACING.m,
    overflow: 'hidden',
    width: '100%',
  },
  horizontalContainer: {
    width: 160,
    marginRight: SPACING.m,
    marginBottom: 0,
    minHeight: 260,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF4B6E',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: RADIUS.card,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantitySelector: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quantityText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    paddingVertical: SPACING.s,
    paddingHorizontal: 8,
    minHeight: 140, // Increased slightly for wrapped badges
  },
  weight: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    height: 36,
    lineHeight: 18,
  },
  deliveryOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  scooterWrapper: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  badgesColumn: {
    flex: 1,
    gap: 4,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    width: 80,
  },
  deliveryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  glitter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginRight: 6,
  },
  comparePrice: {
    fontSize: 12,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  tallCard: {
    // No fixed width, allow flex/container to decide
  },
  smallCard: {
    // No fixed width, allow flex/container to decide
  },
  tallImageContainer: {
    height: 180,
  },
  smallCardFooter: {
    marginTop: 8,
  },
  smallAddBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  smallAddBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  inlineQtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  inlineQtyBtn: {
    padding: 4,
  },
  inlineQtyText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProductCard;
