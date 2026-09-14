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
import { SvgUri } from 'react-native-svg';
import { COLORS, THEMES, SPACING, RADIUS, PRODUCT_CARD_STANDARDS } from '../constants/theme';
import { addItem, removeItem } from '../store/slices/cartSlice';
import { toggleFavorite, toggleFavoriteAsync } from '../store/slices/favoritesSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 2 - SPACING.m) / 2;

export const CARD_STANDARD = PRODUCT_CARD_STANDARDS;


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
  const prodId = product?.id || product?.productId || product?.product_id;
  const isFavorite = useSelector((state) =>
    Boolean(prodId) && (state.favorites?.items || []).some(item => {
      if (!item) return false;
      const targetStr = String(prodId);
      return (
        String(item.id) === targetStr ||
        String(item.productId) === targetStr ||
        String(item.product_id) === targetStr ||
        String(item.product?.id) === targetStr ||
        String(item.product?.productId) === targetStr
      );
    })
  );

  const cartItem = useSelector((state) =>
    state.cart.items.find(item => item.id === product.id)
  );

  const selectedSlot = useSelector((state) => state.config.selectedSlot);
  const isServiceable = useSelector((state) => state.location.isServiceable);

  const quantity = cartItem ? cartItem.quantity : 0;
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  // Defensively unwrap if product is wrapped inside a favorite record { id, product: { ... } }
  const p = (product && product.product) ? { ...product.product, favorite_id: product.id } : (product || {});

  const {
    name,
    image_url,
    imageUrl,
    price,
    discount_price,
    discountPrice,
    weight_unit,
    weightUnit,
  } = p;

  const resolvedImage = image_url || imageUrl || 'https://via.placeholder.com/150';
  const effectiveDiscountPrice = discount_price !== undefined ? discount_price : discountPrice;
  const effectivePrice = Number(price);

  const variantPrices = (product.variants || [])
    .map(v => Number(v.discount_price ?? v.discountPrice ?? v.price))
    .filter(val => !isNaN(val) && val > 0);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;

  const sellingPrice = (effectiveDiscountPrice !== undefined && effectiveDiscountPrice !== null)
    ? effectiveDiscountPrice 
    : (price || minVariantPrice || 0);

  const hasDiscount = effectiveDiscountPrice !== undefined && effectiveDiscountPrice !== null && Number(effectiveDiscountPrice) < effectivePrice;
  const discountPercentage = hasDiscount ? Math.round(((effectivePrice - Number(effectiveDiscountPrice)) / effectivePrice) * 100) : 0;
  const displayUnit = weight_unit || weightUnit || 'kg';

  const hasTomorrowDelivery = Boolean(
    ((product.delivery_options || []).includes('tomorrow_morning') ||
      (product.delivery_options || []).includes('tomorrow_evening') ||
      (product.delivery_options || []).includes('tomorrow')) &&
    (Number(product.scheduled_stock_qty ?? product.scheduledStockQty ?? product.stock_quantity ?? product.stockQuantity ?? 0) > 0)
  );

  const hasExpressDelivery = Boolean(
    (product.delivery_options || []).includes('express') &&
    (Number(product.express_stock_qty ?? product.expressStockQty ?? 0) > 0)
  );

  const handleAddToCart = () => {
    const cutOpts = product.cut_options || product.cutOptions;
    const cleanOpts = product.cleaning_options || product.cleaningOptions;
    const hasCustomization = (cutOpts?.length > 0) ||
      (cleanOpts?.length > 0) ||
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
        {resolvedImage && typeof resolvedImage === 'string' && resolvedImage.toLowerCase().endsWith('.svg') ? (
          <View style={styles.image}>
             <SvgUri
                width="100%"
                height="100%"
                uri={resolvedImage}
             />
          </View>
        ) : (
          <Image
            source={{ uri: resolvedImage }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.heartButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Icon
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? '#EF4444' : '#1E293B'}
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
        <View style={styles.infoContent}>
          <Text style={[styles.weight, { color: activeTheme.textSecondary }]}>{displayUnit || '500g pack'}</Text>
          <Text style={[styles.name, { color: activeTheme.textPrimary }]} numberOfLines={2}>
            {name}
          </Text>

          <View style={styles.deliveryOptionsContainer}>
            {(hasExpressDelivery || hasTomorrowDelivery) ? (
              <>
                <View style={styles.scooterWrapper}>
                  <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                    <Icon name="moped" size={18} color={activeTheme.primary} />
                  </Animated.View>
                </View>
                <View style={[styles.badgesColumn, { flexDirection: (hasExpressDelivery && hasTomorrowDelivery) ? 'column' : 'row', alignItems: 'flex-start', gap: 4 }]}>
                  {hasExpressDelivery && (
                    <View style={[styles.deliveryBadge, { backgroundColor: '#F59E0B', borderColor: '#F59E0B', overflow: 'hidden' }]}>
                      <Icon name="flash" size={10} color={COLORS.white} />
                      <Text style={[styles.deliveryBadgeText, { color: COLORS.white }]}>Express</Text>
                      <Animated.View
                        style={[styles.glitter, { transform: [{ skewX: '-20deg' }, { translateX: shimmerTranslateX }] }]}
                      />
                    </View>
                  )}
                  {hasTomorrowDelivery && (
                    <View style={[styles.deliveryBadge, { backgroundColor: '#10B981', borderColor: '#10B981', overflow: 'hidden' }]}>
                      <Icon name="calendar-clock" size={10} color={COLORS.white} />
                      <Text style={[styles.deliveryBadgeText, { color: COLORS.white }]}>Tomorrow</Text>
                      <Animated.View
                        style={[styles.glitter, { transform: [{ skewX: '-20deg' }, { translateX: shimmerTranslateX }] }]}
                      />
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.deliveryPlaceholder} />
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: activeTheme.textPrimary }]}>₹{sellingPrice}</Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: activeTheme.textSecondary }]}>₹{price}</Text>
            )}
          </View>
        </View>

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
              !((selectedSlot === 'express' 
                ? Number(product.express_stock_qty ?? product.expressStockQty ?? product.stock_quantity ?? product.stockQuantity ?? 0) 
                : Number(product.scheduled_stock_qty ?? product.scheduledStockQty ?? product.stock_quantity ?? product.stockQuantity ?? 0)) > 0) ? (
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
    flex: 1,
    height: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  horizontalContainer: {
    width: CARD_STANDARD.HORIZONTAL_WIDTH,
    height: CARD_STANDARD.HORIZONTAL_HEIGHT,
    marginRight: SPACING.m,
    marginBottom: 0,
  },
  imageContainer: {
    width: '100%',
    height: CARD_STANDARD.IMAGE_HEIGHT,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
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
    padding: CARD_STANDARD.INFO_PADDING,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  infoContent: {
    flex: 1,
  },
  weight: {
    fontSize: 12,
    color: COLORS.gray,
    height: CARD_STANDARD.UNIT_HEIGHT,
    lineHeight: CARD_STANDARD.UNIT_HEIGHT,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    height: CARD_STANDARD.NAME_HEIGHT,
    lineHeight: 18,
  },
  deliveryOptionsContainer: {
    height: CARD_STANDARD.DELIVERY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  deliveryPlaceholder: {
    height: CARD_STANDARD.DELIVERY_ROW_HEIGHT,
  },
  scooterWrapper: {
    width: 24,
    alignItems: 'center',
  },
  badgesColumn: {
    flex: 1,
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
  },
  deliveryBadgeText: {
    fontSize: 11,
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
    height: CARD_STANDARD.PRICE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
    // Standard tall card
  },
  smallCard: {
    // Standard small card
  },
  tallImageContainer: {
    height: 180,
  },
  smallCardFooter: {
    height: CARD_STANDARD.FOOTER_HEIGHT,
    marginTop: 6,
    justifyContent: 'center',
  },
  smallAddBtn: {
    backgroundColor: COLORS.primary,
    height: CARD_STANDARD.FOOTER_HEIGHT,
    borderRadius: CARD_STANDARD.FOOTER_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAddBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  inlineQtySelector: {
    height: CARD_STANDARD.FOOTER_HEIGHT,
    borderRadius: CARD_STANDARD.FOOTER_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
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
