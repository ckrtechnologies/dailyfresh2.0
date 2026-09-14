import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import productService from '../api/productService';
import { useDispatch, useSelector } from 'react-redux';
import { showGlobalAlert } from '../services/alertService';
import { addItem, removeItem } from '../store/slices/cartSlice';
import { toggleFavorite, toggleFavoriteAsync } from '../store/slices/favoritesSlice';
import favoritesService from '../api/favoritesService';
import LogoLoader from '../components/LogoLoader';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedCut, setSelectedCut] = useState(null);
  const [selectedCleaning, setSelectedCleaning] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [deliverySlotsConfig, setDeliverySlotsConfig] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const { items: favorites } = useSelector((state) => state.favorites);
  const { items: cartItems } = useSelector((state) => state.cart);
  const selectedSlot = useSelector((state) => state.config.selectedSlot);
  const configFromRedux = useSelector((state) => state.config.delivery_slots_config);
  
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
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

  // Helper to find quantity for a specific config
  const getCartQuantity = (variant = null) => {
    if (!product) return 0;
    const item = cartItems.find(i =>
      i.id === product.id &&
      i.variant?.id === variant?.id &&
      i.cutPreference === (variant ? null : selectedCut) &&
      i.cleaningPreference === (variant ? null : selectedCleaning)
    );
    return item ? item.quantity : 0;
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await productService.getProductDetail(productId);
        if (response.success && response.data) {
          const data = response.data;
          setProduct(data);
          if (data.cut_options?.length > 0) setSelectedCut(data.cut_options[0]);
          if (data.cleaning_options?.length > 0) setSelectedCleaning(data.cleaning_options[0]);

          // Auto-select Customize tab if variants exist
          if (data.variants?.length > 0) {
            setActiveTab('customize');
          } else {
            setActiveTab('about');
          }

          fetchSimilarProducts(data.sub_category_id);
        } else {
          // Product not found / deleted / inactive
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchConfig = async () => {
      // Prioritize config from Redux if available
      if (configFromRedux) {
        setDeliverySlotsConfig(configFromRedux);
        return;
      }
      try {
        const res = await productService.getSettings();
        if (res.success && res.data.delivery_slots_config) {
          try {
            setDeliverySlotsConfig(JSON.parse(res.data.delivery_slots_config));
          } catch (parseError) {
            console.error('Failed to parse delivery_slots_config:', parseError);
            setDeliverySlotsConfig({}); 
          }
        }
      } catch (error) {
        console.error('Error fetching delivery config:', error);
      }
    };

    fetchDetail();
    fetchConfig();
  }, [productId]); // Only fetch when ID changes

  // Separate effect for cart sync to avoid triggering fetchDetail
  useEffect(() => {
    const existingItem = cartItems.find(i => i.id === productId && !i.variant);
    if (existingItem) {
      setQuantity(existingItem.quantity);
    }
  }, [productId, cartItems]);

  const fetchSimilarProducts = async (subCategoryId) => {
    try {
      let res = await productService.getProducts({ subCategoryId });
      let products = res.success ? res.data.filter(p => p.id !== productId) : [];

      // Fallback: If no similar products in sub-category, try parent category
      if (products.length < 2 && product?.sub_category?.category_id) {
        const catRes = await productService.getProducts({ categoryId: product.sub_category.category_id });
        if (catRes.success) {
          const additional = catRes.data.filter(p => p.id !== productId && !products.some(sp => sp.id === p.id));
          products = [...products, ...additional];
        }
      }

      setSimilarProducts(products.slice(0, 10)); // Max 10 items
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const handleToggleFavorite = () => {
    if (product) {
      dispatch(toggleFavorite(product));
      dispatch(toggleFavoriteAsync(product));
    }
  };

  const handleAddToCart = (variant = null, overrideQuantity = null) => {
    const qty = overrideQuantity !== null ? overrideQuantity : quantity;
    const itemToAdd = {
      product: {
        ...product,
        name: variant ? variant.name : (selectedCut ? `${selectedCut}` : product.name),
        price: variant ? (variant.discount_price || variant.price) : sellingPrice,
        image_url: (variant && variant.image_url) ? variant.image_url : product.image_url
      },
      quantity: qty,
      variant: variant,
      cutPreference: variant ? null : selectedCut,
      cleaningPreference: variant ? null : selectedCleaning
    };
    dispatch(addItem(itemToAdd));
  };

  const handleRemoveFromCart = (variant = null) => {
    dispatch(removeItem({
      id: product.id,
      variant: variant,
      cutPreference: variant ? null : selectedCut,
      cleaningPreference: variant ? null : selectedCleaning
    }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this fresh ${product.name} on Daily Fresh! \n\n${product.description || ''}`,
        url: 'https://dailyfreshkolkata.in', // Fallback website
        title: product.name
      });
    } catch (error) {
      console.error('Sharing error:', error);
    }
  };

  if (loading) {
    return <LogoLoader fullScreen />;
  }

  if (notFound || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <StatusBar backgroundColor={activeTheme.primary} barStyle="light-content" />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View style={[{ backgroundColor: activeTheme.primary, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Product Detail</Text>
          </View>
        </View>
        <Icon name="package-variant-remove" size={80} color="#D1D5DB" />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 20, marginBottom: 10, textAlign: 'center' }}>
          Product Unavailable
        </Text>
        <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          This product has been removed or is no longer available. Please explore our other fresh products.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: activeTheme.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, elevation: 4 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sellingPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  // Availability Logic
  const options = Array.isArray(product.delivery_options)
    ? product.delivery_options
    : (Array.isArray(product.deliveryOptions) ? product.deliveryOptions : []);
  const normalizedSlot = (selectedSlot || 'express').toLowerCase();

  const isProductSlotAvailable = () => {
    if (normalizedSlot === 'express') {
      return options.length === 0 || options.includes('express');
    }
    if (normalizedSlot === 'tomorrow') {
      return options.length === 0 || options.includes('tomorrow_morning') || options.includes('tomorrow_evening') || options.includes('tomorrow');
    }
    return true;
  };

  const getAvailableVariants = () => {
    if (!product.variants || product.variants.length === 0) return [];
    return product.variants.filter(variant => {
      const rawInfo = variant.delivery_info || variant.deliveryInfo;
      const info = Array.isArray(rawInfo)
        ? rawInfo
        : (rawInfo ? String(rawInfo).split(',').map(s => s.trim().toLowerCase()) : []);

      if (normalizedSlot === 'express') {
        const variantMatches = info.some(slot => String(slot).toLowerCase().includes('express'));
        return variantMatches || options.includes('express') || options.length === 0;
      }
      
      if (normalizedSlot === 'tomorrow') {
        const variantMatches = info.some(slot => {
          const s = String(slot).toLowerCase();
          return s.includes('morning') || s.includes('evening') || s.includes('tomorrow');
        });
        return variantMatches || options.includes('tomorrow_morning') || options.includes('tomorrow_evening') || options.includes('tomorrow') || options.length === 0;
      }

      return true;
    });
  };

  const availableVariants = getAvailableVariants();
  const hasVariants = product.variants?.length > 0;

  const isAvailable = hasVariants ? (availableVariants.length > 0 || isProductSlotAvailable()) : isProductSlotAvailable();

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={activeTheme.primary}
        barStyle="light-content"
      />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {(() => {
            const uri = product.image_url || product.imageUrl;
            if (uri && typeof uri === 'string' && uri.toLowerCase().endsWith('.svg')) {
              return (
                <View style={styles.image}>
                  <SvgUri width="100%" height="100%" uri={uri} />
                </View>
              );
            }
            return <Image source={{ uri }} style={styles.image} />;
          })()}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.categoryName}>{product.sub_category?.category?.name || product.subCategory?.category?.name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.weight}>{product.weight_unit || product.weightUnit || '500g'}</Text>

          {!isAvailable && (
            <View style={styles.unavailableBanner}>
              <Icon name="alert-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.unavailableText}>Not available for your selected delivery slot</Text>
            </View>
          )}

          {isAvailable && !hasVariants && (
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{sellingPrice}</Text>
                {hasDiscount && (
                  <Text style={styles.comparePrice}>₹{product.price}</Text>
                )}
              </View>
              <View style={styles.quantityContainer}>
                {getCartQuantity() > 0 ? (
                  <>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleRemoveFromCart()}
                    >
                      <Text style={{ fontSize: 24, color: activeTheme.primary, fontWeight: '700', lineHeight: 24 }}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{getCartQuantity()}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleAddToCart(null, 1)}
                    >
                      <Text style={{ fontSize: 24, color: activeTheme.primary, fontWeight: '700', lineHeight: 24 }}>+</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.addBtn, { paddingHorizontal: 24, height: 40, backgroundColor: activeTheme.primary }]}
                    onPress={() => handleAddToCart()}
                  >
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Preferences Section - Key FreshToHome Feature
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cut Preference</Text>
            <View style={styles.optionsGrid}>
              {['Curry Cut', 'Boneless Cubes', 'Fillets', 'Whole'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, selectedCut === opt && styles.selectedOption]}
                  onPress={() => setSelectedCut(opt)}
                >
                  <Text style={[styles.optionText, selectedCut === opt && styles.selectedOptionText]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View> */}

          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cleaning Preference</Text>
            <View style={styles.optionsGrid}>
              {['Cleaned & Ready', 'Uncleaned'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, selectedCleaning === opt && styles.selectedOption]}
                  onPress={() => setSelectedCleaning(opt)}
                >
                  <Text style={[styles.optionText, selectedCleaning === opt && styles.selectedOptionText]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View> */}

          {!(product.variants?.length > 0) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="truck-delivery" size={22} color={activeTheme.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Delivery Availability</Text>
              </View>
              <View style={styles.deliveryGrid}>
                {/* Express Badge */}
                {(product.delivery_options || []).includes('express') && product.express_stock_qty > 0 && (
                  <View style={[
                    styles.deliveryCard, 
                    { 
                      backgroundColor: selectedSlot === 'express' ? '#F59E0B' : COLORS.white,
                      borderColor: selectedSlot === 'express' ? '#F59E0B' : '#e2e8f0',
                    }
                  ]}>
                    <View style={[styles.deliveryIconContainer, { backgroundColor: selectedSlot === 'express' ? 'rgba(255,255,255,0.2)' : '#FFFBEB' }]}>
                      <Icon name="lightning-bolt" size={24} color={selectedSlot === 'express' ? COLORS.white : '#F59E0B'} />
                    </View>
                    <Text style={[styles.deliveryLabel, { color: selectedSlot === 'express' ? COLORS.white : COLORS.dark }]}>Express</Text>
                    <Text style={[styles.deliveryTime, { color: selectedSlot === 'express' ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>90 Mins</Text>
                  </View>
                )}

                {/* Tomorrow Badge */}
                {(((product.delivery_options || product.deliveryOptions || []).includes('tomorrow_morning') || 
                  (product.delivery_options || product.deliveryOptions || []).includes('tomorrow_evening') ||
                  (product.delivery_options || product.deliveryOptions || []).includes('tomorrow'))) && 
                 Number(product.scheduled_stock_qty ?? product.scheduledStockQty ?? product.stock_quantity ?? product.stockQuantity ?? 0) > 0 && (
                  <View style={[
                    styles.deliveryCard,
                    {
                      backgroundColor: selectedSlot === 'tomorrow' ? '#10B981' : COLORS.white,
                      borderColor: selectedSlot === 'tomorrow' ? '#10B981' : '#e2e8f0',
                    }
                  ]}>
                    <View style={[styles.deliveryIconContainer, { backgroundColor: selectedSlot === 'tomorrow' ? 'rgba(255,255,255,0.2)' : '#ECFDF5' }]}>
                      <Icon name="calendar-clock" size={24} color={selectedSlot === 'tomorrow' ? COLORS.white : '#10B981'} />
                    </View>
                    <Text style={[styles.deliveryLabel, { color: selectedSlot === 'tomorrow' ? COLORS.white : COLORS.dark }]}>Tomorrow</Text>
                    <Text style={[styles.deliveryTime, { color: selectedSlot === 'tomorrow' ? 'rgba(255,255,255,0.8)' : COLORS.gray }]}>Scheduled</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Product Detail Tabs */}
          <View style={styles.tabContainer}>
            {hasVariants && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'customize' && styles.activeTab]}
                onPress={() => setActiveTab('customize')}
              >
                <Text style={[styles.tabText, activeTab === 'customize' && styles.activeTabText]}>Customize</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.tab, activeTab === 'about' && styles.activeTab]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, (activeTab === 'recipe' || activeTab === 'guide') && styles.activeTab]}
              onPress={() => setActiveTab('recipe')}
            >
              <Text style={[styles.tabText, (activeTab === 'recipe' || activeTab === 'guide') && styles.activeTabText]}>Cooking Guide</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'customize' && hasVariants && (
            <View style={styles.tabContent}>
              {availableVariants.map((variant) => (
                <View key={variant.id} style={styles.variantCard}>
                  <View style={styles.variantTop}>
                    <View style={styles.variantInfo}>
                      <Text style={styles.variantWeight}>{variant.weight_text}</Text>
                      <View style={styles.variantTitleRow}>
                        <Text style={styles.variantName}>{variant.name}</Text>
                        {variant.description && (
                          <TouchableOpacity style={styles.infoIcon}>
                            <Icon name="information-outline" size={16} color={COLORS.gray} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.variantPriceRow}>
                        <Text style={styles.variantPrice}>₹{variant.discount_price || variant.price}</Text>
                        {variant.discount_price && (
                          <View style={styles.memberBadge}>
                            <Icon name="alpha-p-circle" size={16} color="#fbbf24" />
                            <Text style={styles.memberPriceText}>₹{variant.discount_price}</Text>
                            <Icon name="chevron-right" size={12} color="#fbbf24" />
                          </View>
                        )}
                      </View>

                      <View style={styles.deliverySlotsContainer}>
                        {(() => {
                          const rawSlots = Array.isArray(variant.delivery_info)
                            ? variant.delivery_info
                            : (variant.delivery_info ? String(variant.delivery_info).split(',').map(s => s.trim()) : []);
                          const productOpts = Array.isArray(product.delivery_options) ? product.delivery_options : (product.deliveryOptions || []);

                          const hasExpress = rawSlots.some(s => String(s).toLowerCase().includes('express')) && productOpts.includes('express');
                          const hasTomorrow = rawSlots.some(s => {
                            const str = String(s).toLowerCase();
                            return str.includes('morning') || str.includes('evening') || str.includes('tomorrow');
                          }) && (productOpts.includes('tomorrow_morning') || productOpts.includes('tomorrow_evening') || productOpts.includes('tomorrow'));

                          const badges = [];
                          if (hasExpress) {
                            badges.push({ label: 'Express', icon: 'flash', color: '#F59E0B' });
                          }
                          if (hasTomorrow) {
                            badges.push({ label: 'Tomorrow', icon: 'calendar-clock', color: '#10B981' });
                          }

                          return badges.map((b, bIdx) => (
                            <View key={bIdx} style={[styles.deliveryBadge, { backgroundColor: b.color + '12' }]}>
                              <Icon name={b.icon} size={12} color={b.color} />
                              <Text style={[styles.deliveryBadgeText, { color: b.color }]}>{b.label}</Text>
                            </View>
                          ));
                        })()}
                      </View>
                    </View>

                    <View style={styles.variantImageContainer}>
                      {(() => {
                        const vUri = variant.image_url || product.image_url;
                        if (vUri && typeof vUri === 'string' && vUri.toLowerCase().endsWith('.svg')) {
                          return (
                            <View style={styles.variantImage}>
                              <SvgUri width="100%" height="100%" uri={vUri} />
                            </View>
                          );
                        }
                        return (
                          <Image
                            source={{ uri: vUri }}
                            style={styles.variantImage}
                          />
                        );
                      })()}
                      {getCartQuantity(variant) > 0 ? (
                        <View style={styles.variantQtySelector}>
                          <TouchableOpacity
                            style={styles.variantQtyBtn}
                            onPress={() => handleRemoveFromCart(variant)}
                          >
                            <Icon name="minus" size={16} color={activeTheme.primary} />
                          </TouchableOpacity>
                          <Text style={styles.variantQtyText}>{getCartQuantity(variant)}</Text>
                          <TouchableOpacity
                            style={styles.variantQtyBtn}
                            onPress={() => handleAddToCart(variant, 1)}
                          >
                            <Icon name="plus" size={16} color={activeTheme.primary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.variantAddBtn, { backgroundColor: activeTheme.primary }]}
                          onPress={() => handleAddToCart(variant)}
                        >
                          <Text style={styles.variantAddText}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              <View style={styles.descriptionSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIndicator} />
                  <Text style={styles.descriptionHeader}>Product Story</Text>
                </View>
                <Text style={styles.description}>
                  {product.description || 'Sourced with care from the best vendors to ensure premium quality, taste, and freshness for your kitchen.'}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Icon name="circle-medium" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Net Weight: {product.weight_unit || '500g'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon name="circle-medium" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.infoLabel}>Shelf Life: 2-3 Days</Text>
                </View>
              </View>
            </View>
          )}

          {(activeTab === 'recipe' || activeTab === 'guide') && (
            <View style={styles.tabContent}>
              {/* Visual Steps from Highlights */}
              {product.product_highlights && product.product_highlights.length > 0 && (
                <View style={styles.highlightsGrid}>
                  {product.product_highlights.map((h, i) => (
                    <View key={i} style={styles.highlightCard}>
                      <View style={styles.highlightIconContainer}>
                        <Icon name={h.icon || 'chef-hat'} size={24} color={COLORS.primary} />
                      </View>
                      <Text style={styles.highlightText}>{h.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeBadge}>
                    <Icon name="chef-hat" size={20} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.recipeHeaderText}>Chef's Secret</Text>
                    <Text style={styles.recipeSubText}>Step-by-step instructions</Text>
                  </View>
                </View>

                <View style={styles.recipeBody}>
                  {(() => {
                    const rawGuide = product.cooking_guide || product.cookingGuide;
                    let steps = [];
                    if (Array.isArray(rawGuide)) {
                      steps = rawGuide;
                    } else if (typeof rawGuide === 'string' && rawGuide.trim()) {
                      try {
                        const parsed = JSON.parse(rawGuide);
                        if (Array.isArray(parsed)) steps = parsed;
                        else steps = rawGuide.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
                      } catch {
                        steps = rawGuide.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
                      }
                    }
                    if (steps.length > 0) {
                      return steps.map((step, index) => {
                        const cleanedText = String(step)
                          .replace(/^(step\s*\d*[:.-]*|\d+[\.\):-]*)\s*/i, '')
                          .trim();
                        return (
                          <View key={index} style={styles.stepContainer}>
                            <View style={styles.stepNumber}>
                              <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{cleanedText || step}</Text>
                          </View>
                        );
                      });
                    }
                    return (
                      <View style={styles.emptyRecipe}>
                        <Icon name="silverware-clean" size={40} color="#cbd5e1" />
                        <Text style={styles.emptyRecipeText}>No instructions provided yet. Stay tuned for recipes!</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </View>
          )}

        </View>

        {/* You May Also Like - Moved outside infoContainer for better layout */}
        {similarProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={styles.similarTitle}>You May Also Like</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { subCategoryId: product.sub_category_id })}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
              {similarProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.similarCard}
                  onPress={() => navigation.push('ProductDetail', { productId: p.id })}
                  activeOpacity={0.8}
                >
                  <View style={{ width: '100%', height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
                    {(() => {
                      const simUri = p.image_url;
                      if (simUri && typeof simUri === 'string' && simUri.toLowerCase().endsWith('.svg')) {
                        return (
                          <View style={styles.similarImage}>
                            <SvgUri width="100%" height="100%" uri={simUri} />
                          </View>
                        );
                      }
                      return <Image source={{ uri: simUri }} style={styles.similarImage} />;
                    })()}
                  </View>
                  <View style={styles.similarInfo}>
                    <Text style={styles.similarName} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.similarPrice}>₹{p.discount_price || p.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.infoContainer, { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <View style={styles.trustStrip}>
            <View style={styles.trustItem}>
              <Icon name="leaf" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.trustText}>Freshly Caught</Text>
            </View>
            <View style={styles.trustItem}>
              <Icon name="shield-check" size={24} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.trustText}>Chemical-Free</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Header with Premium Icons - Rendered after ScrollView for top-level touch responsiveness */}
      <View style={[styles.header, { top: insets.top > 0 ? insets.top + 6 : 12, zIndex: 999, elevation: 999 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: activeTheme.primary }]}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-left" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: activeTheme.primary }]}
            onPress={handleShare}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="share-variant" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#FFFFFF' }]}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? '#EF4444' : '#1E293B'}
            />
          </TouchableOpacity>
        </View>
      </View>

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
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  unavailableText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.s,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: width,
    height: width * 0.8,
    backgroundColor: COLORS.lightGray,
  },
  infoContainer: {
    padding: SPACING.l,
    marginTop: -RADIUS.l,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '800', // Bolder
    color: COLORS.dark,
    marginTop: 8, // More space from back button if overlapping
    lineHeight: 32, // Better spacing
  },
  weight: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.l,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
  },
  comparePrice: {
    fontSize: 16,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.s,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.m,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: SPACING.m,
    color: COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  deliveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
  },
  deliveryCard: {
    width: '48.5%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  deliveryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  deliveryTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.s,
    marginBottom: SPACING.s,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 150, 0, 0.05)',
  },
  optionText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginHorizontal: -SPACING.l, // Pull back padding of infoContainer
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabContent: {
    paddingVertical: SPACING.xl,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  highlightCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  highlightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 150, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '700',
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping to prevent overlap
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24, // Consistent spacing
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recipeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  recipeSubText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  recipeBody: {
    padding: SPACING.l,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 150, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyRecipe: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyRecipeText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  similarSection: {
    paddingTop: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: '#fff',
    borderTopWidth: 8,
    borderTopColor: '#f8fafc',
    paddingHorizontal: SPACING.l,
  },
  similarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  similarList: {
    paddingRight: SPACING.l,
    paddingBottom: SPACING.m,
  },
  similarCard: {
    width: 150,
    marginRight: SPACING.m,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  similarImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  similarInfo: {
    padding: SPACING.s,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
    lineHeight: 18,
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  trustStrip: {
    flexDirection: 'row',
    marginTop: SPACING.m,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  trustBadgeImage: {
    width: 28,
    height: 28,
    marginRight: 6,
    resizeMode: 'contain',
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  variantCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: SPACING.m,
    padding: SPACING.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  variantTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variantInfo: {
    flex: 1,
    paddingRight: SPACING.m,
  },
  variantWeight: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  variantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  infoIcon: {
    marginLeft: 6,
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  variantPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginRight: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  memberPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginHorizontal: 2,
  },
  deliverySlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  variantImageContainer: {
    alignItems: 'center',
  },
  variantImage: {
    width: 100,
    height: 70,
    borderRadius: RADIUS.s,
    backgroundColor: COLORS.lightGray,
  },
  variantAddBtn: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  variantAddText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  footerInCart: {
    paddingHorizontal: 0,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.button,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  variantQtySelector: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.s,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  variantQtyBtn: {
    padding: 4,
  },
  variantQtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginHorizontal: 8,
    minWidth: 16,
    textAlign: 'center',
  },
  qtySelectorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    width: '100%',
  },
  footerQtyValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerQtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  footerQtyText: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ProductDetailScreen;
