import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { addItem, removeItem, clearCart, updateCartAfterValidation } from '../store/slices/cartSlice';
import { setSelectedAddress } from '../store/slices/locationSlice';
import productService from '../api/productService';
import addressService from '../api/addressService';
import cartService from '../api/cartService';
import apiClient from '../api/apiClient';
import { showGlobalAlert } from '../services/alertService';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { address, selectedAddress } = useSelector((state) => state.location);
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const [gstRate, setGstRate] = useState(12);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const flatListRef = useRef(null);

  const FREE_DELIVERY_THRESHOLD = 499;
  const { storeId } = useSelector((state) => state.location);
  const [validating, setValidating] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);

  const handleAddressSelect = async (addr) => {
    try {
      setValidating(true);
      // Resolve store for the selected address
      const res = await apiClient.get('/customer/stores/nearest', {
        params: {
          pincode: addr.pincode,
          lat: addr.latitude,
          lng: addr.longitude
        }
      });
      
      const store = res.data?.data?.store;
      
      dispatch(setSelectedAddress({
        ...addr,
        store_id: store?.id || null,
        store_name: store?.name || null
      }));
      
      setShowAddressModal(false);
    } catch (err) {
      console.error('Failed to resolve store for address:', err);
      dispatch(setSelectedAddress(addr));
      setShowAddressModal(false);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settingsRes = await productService.getSettings();
        if (settingsRes.success && settingsRes.data) {
          if (settingsRes.data.gst_rate) setGstRate(parseFloat(settingsRes.data.gst_rate));
          if (settingsRes.data.delivery_fee) setDeliveryFee(parseFloat(settingsRes.data.delivery_fee));
        }

        if (!selectedAddress) {
          const addrRes = await addressService.getAddresses();
          if (addrRes.success && addrRes.data.addresses.length > 0) {
            const defaultAddr = addrRes.data.addresses.find(a => a.is_default) || addrRes.data.addresses[0];
            await handleAddressSelect(defaultAddr);
          }
        }
      } catch (error) {
        console.log('Initial data fetch error:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Soft Re-validation Logic B - Triggers when storeId changes
  useEffect(() => {
    const revalidate = async () => {
      // Run validation if we have items, regardless of whether a store is resolved
      // If storeId is missing, it means the location is unserviceable, so items MUST be removed/flagged.
      if (items.length > 0) {
        // If no storeId, all items are effectively "mismatched"
        const needsValidation = !storeId || items.some(item => item.store_id !== storeId);
        
        if (needsValidation) {
          console.log('[CartScreen] Store mismatch detected. Validating cart with store:', storeId);
          console.log('[CartScreen] Sending items to validate:', items.map(it => ({ id: it.id, name: it.name, store: it.store_id })));
          setValidating(true);
          setValidationMessage('Checking availability at your new location...');
          const res = await cartService.validateCart(items, storeId);
          setValidating(false);
          
          if (res.success && res.data.hasChanges) {
            dispatch(updateCartAfterValidation({ items: res.data.items }));
            cartService.syncCart(res.data.items);
            
            let removedCount = res.data.changes.removed.length;
            if (removedCount > 0) {
              setValidationMessage(`${removedCount} item(s) are not available at this location. Please remove them to proceed.`);
            } else {
              setValidationMessage('Prices or stock have been updated for your new location.');
            }
            
            // Note: We no longer auto-dispatch updateCartAfterValidation here 
            // so the user can see the unserviceable items highlighted.
          } else {
            setValidationMessage(null);
          }
        } else {
          setValidationMessage(null);
        }
      }
    };
    revalidate();
  }, [storeId, dispatch, items.length]);

  const currentDeliveryFee = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryFee;
  const tax = totalAmount * (gstRate / 100);
  const grandTotal = totalAmount + currentDeliveryFee + tax;

  const handleClearCart = () => {
    showGlobalAlert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => dispatch(clearCart()) }
      ]
    );
  };

  const renderCartItem = ({ item }) => {
    const isUnserviceable = storeId && item.store_id !== storeId;
    
    return (
      <View style={[styles.cartItem, isUnserviceable && styles.unserviceableItem]}>
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemWeight}>{item.weight_unit || '500g pack'}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          
          {isUnserviceable && (
            <View style={styles.unserviceableBadge}>
              <Icon name="alert-circle-outline" size={12} color="#EF4444" />
              <Text style={styles.unserviceableText}>NOT AVAILABLE HERE</Text>
            </View>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(removeItem(item))}>
            <Icon name="minus" size={20} color={isUnserviceable ? '#6B7280' : activeTheme.primary} />
          </TouchableOpacity>
          <Text style={[styles.quantity, { color: isUnserviceable ? '#6B7280' : activeTheme.primary }]}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(addItem(item))}>
            <Icon name="plus" size={20} color={isUnserviceable ? '#6B7280' : activeTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="cart-off" size={100} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.shopText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {validating && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={activeTheme.primary} />
          <Text style={styles.loaderText}>Validating Cart...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => `${item.id}-${item.variant?.id || 'base'}-${item.cutPreference || 'none'}-${item.cleaningPreference || 'none'}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <>
            {validationMessage && (
              <View style={[styles.validationBanner, { backgroundColor: validating ? '#EFF6FF' : '#FFFBEB', borderColor: validating ? '#3B82F6' : '#F59E0B' }]}>
                <Icon 
                  name={validating ? "information-outline" : "alert-circle-outline"} 
                  size={20} 
                  color={validating ? "#3B82F6" : "#D97706"} 
                />
                <Text style={[styles.validationText, { color: validating ? "#1E40AF" : "#92400E" }]}>
                  {validationMessage}
                </Text>
                {!validating && (
                  <TouchableOpacity onPress={() => setValidationMessage(null)}>
                    <Icon name="close" size={18} color="#92400E" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={[styles.addressSection, { borderColor: activeTheme.primary + '30', borderWidth: 1 }]}>
              <View style={styles.addressHeader}>
                <View style={styles.addressTitleRow}>
                  <View style={[styles.addressIconCircle, { backgroundColor: activeTheme.primary + '15' }]}>
                    <Icon name="map-marker-radius" size={18} color={activeTheme.primary} />
                  </View>
                  <View>
                    <Text style={styles.addressTitle}>Delivering to</Text>
                    <Text style={styles.addressLabel}>{selectedAddress?.label || 'Current Location'}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.changeBtn, { backgroundColor: activeTheme.primary + '10' }]} 
                  onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
                >
                  <Text style={[styles.changeText, { color: activeTheme.primary }]}>CHANGE</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.addressDivider} />
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress ? `${selectedAddress.line1}${selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, ${selectedAddress.city}` : (address || 'Pick an address to see delivery slots')}
              </Text>
            </View>
          </>
        )}
        ListFooterComponent={() => (
          <View style={styles.billContainer}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <View style={styles.billRow}><Text style={styles.billLabel}>Item Total</Text><Text style={styles.billValue}>₹{Number(totalAmount || 0).toFixed(2)}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={[styles.billValue, currentDeliveryFee === 0 && { color: COLORS.primary }]}>{currentDeliveryFee === 0 ? 'FREE' : `₹${Number(deliveryFee || 0).toFixed(2)}`}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Taxes</Text><Text style={styles.billValue}>₹{Number(tax || 0).toFixed(2)}</Text></View>
            <View style={[styles.billRow, styles.totalRow]}><Text style={styles.totalLabel}>Grand Total</Text><Text style={[styles.totalValue, { color: activeTheme.primary }]}>₹{Number(grandTotal || 0).toFixed(2)}</Text></View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>₹{Number(grandTotal || 0).toFixed(2)}</Text>
          <Text style={styles.footerSub}>Incl. all taxes</Text>
        </View>

        {selectedAddress ? (
          <TouchableOpacity
            style={[
              styles.checkoutBtn, 
              { backgroundColor: activeTheme.primary },
              (validating || items.some(it => it.store_id !== storeId)) && { opacity: 0.6 }
            ]}
            onPress={() => navigation.navigate('Checkout')}
            disabled={validating || items.some(it => it.store_id !== storeId)}
          >
            <Text style={styles.checkoutText}>
              {validating ? 'Validating Cart...' : 'Proceed to Checkout'}
            </Text>
            {validating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="chevron-right" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
          >
            <Text style={styles.checkoutText}>Pick Delivery Address</Text>
            <Icon name="map-marker-plus" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.l, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  clearText: { color: '#FF4D4D', fontWeight: '600' },
  list: { padding: SPACING.m },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.card, padding: SPACING.m, marginBottom: SPACING.m, alignItems: 'center' },
  itemImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f1f5f9' },
  itemInfo: { flex: 1, marginLeft: SPACING.m },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  itemWeight: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(125, 180, 52, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
  qtyBtn: { padding: 6 },
  quantity: { paddingHorizontal: 8, fontWeight: '700', color: COLORS.primary, fontSize: 16 },
  addressSection: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.m },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addressTitle: { fontSize: 11, fontWeight: '600', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressLabel: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeText: { fontSize: 11, fontWeight: '800' },
  addressDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },
  addressText: { color: COLORS.gray, fontSize: 13, lineHeight: 18 },
  billContainer: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.xl },
  billTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: SPACING.m },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s },
  billLabel: { color: COLORS.gray, fontSize: 14 },
  billValue: { color: COLORS.dark, fontSize: 14, fontWeight: '500' },
  totalRow: { marginTop: SPACING.m, paddingTop: SPACING.m, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  totalValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  footer: { backgroundColor: COLORS.white, padding: SPACING.l, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerPrice: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  footerSub: { fontSize: 12, color: COLORS.gray },
  checkoutBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: 24, alignItems: 'center', gap: 8 },
  checkoutText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: COLORS.white },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginTop: 20 },
  emptySubtitle: { textAlign: 'center', color: COLORS.gray, marginTop: 10, marginBottom: 30 },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 24 },
  shopText: { color: COLORS.white, fontWeight: '700' },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  unserviceableItem: {
    opacity: 0.6,
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  unserviceableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  unserviceableText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
});

export default CartScreen;
