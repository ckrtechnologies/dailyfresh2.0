import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import { ENV } from '../config/env';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { clearCart, updateCartAfterValidation } from '../store/slices/cartSlice';
import { fetchActiveOrder } from '../store/slices/orderSlice';
import orderService from '../api/orderService';
import cartService from '../api/cartService';
import addressService from '../api/addressService';
import productService from '../api/productService';
import { setServiceability, setSelectedAddress } from '../store/slices/locationSlice';
import LogoLoader from '../components/LogoLoader';
import { showGlobalAlert } from '../services/alertService';
import SubSlotPicker from '../components/SubSlotPicker';

// Removed DELIVERY_SLOTS constant as it is now managed globally

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { address, pincode, storeId, coords, selectedAddress, isServiceable } = useSelector((state) => state.location);

  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  // Slot labels for display
  const slotLabels = {
    'express': { label: 'Express Delivery', time: 'Within 90 mins', icon: 'flash', color: '#F59E0B' },
    'tomorrow': { label: 'Tomorrow Delivery', time: 'Select Time Window', icon: 'calendar', color: '#10B981' },
  };

  const currentSlot = slotLabels[selectedSlot] || slotLabels['express'];

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showSubSlotPicker, setShowSubSlotPicker] = useState(false);
  const [selectedSubSlot, setSelectedSubSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'razorpay'

  // Fetch address if not already selected in Redux and resolve nearest store for delivery address
  useEffect(() => {
    const initAddress = async () => {
      let addrToResolve = selectedAddress;
      if (!addrToResolve) {
        try {
          const res = await addressService.getAddresses();
          const addressList = res.data?.addresses || (Array.isArray(res.data) ? res.data : []);
          if (addressList.length > 0) {
            addrToResolve = addressList.find(a => a.is_default || a.isDefault) || addressList[0];
          }
        } catch (e) {
          console.log('Error initializing address:', e);
        }
      }

      if (addrToResolve && (!addrToResolve.store_id && !addrToResolve.storeId)) {
        try {
          const { default: apiClient } = await import('../api/apiClient');
          const storeParams = {
            pincode: addrToResolve.pincode,
            lat: addrToResolve.latitude || undefined,
            lng: addrToResolve.longitude || undefined,
          };
          const storeRes = await apiClient.get('/customer/stores/nearest', { params: storeParams });
          const storeData = storeRes.data?.data;
          const matchedStore = storeData?.store;
          const isDeliverable = storeData?.is_deliverable === true && !!matchedStore;

          const addressWithStore = {
            ...addrToResolve,
            store_id: isDeliverable ? matchedStore.id : null,
            store_name: isDeliverable ? matchedStore.name : null,
            is_serviceable: isDeliverable,
          };
          dispatch(setSelectedAddress(addressWithStore));
        } catch (resolveErr) {
          console.warn('Failed to resolve store for address in checkout:', resolveErr);
          if (!selectedAddress && addrToResolve) {
            dispatch(setSelectedAddress(addrToResolve));
          }
        }
      } else if (!selectedAddress && addrToResolve) {
        dispatch(setSelectedAddress(addrToResolve));
      }
    };
    initAddress();
  }, [selectedAddress, dispatch]);

  const showAlert = (title, message, type = 'info', buttons = []) => {
    showGlobalAlert(title, message, type, buttons);
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    setShowCouponsModal(true);
    const res = await orderService.getAvailableCoupons();
    if (res.success) {
      setAvailableCoupons(Array.isArray(res.data) ? res.data : (res.data.coupons || []));
    }
    setLoadingCoupons(false);
  };

  // Constants
  const gstRate = 12;
  const deliveryFee = (totalAmount || 0) >= 499 ? 0 : 30;
  const tax = (totalAmount || 0) * (gstRate / 100);
  const discount = (couponData || {}).discount_amount || 0;
  const grandTotal = Math.max(0, (totalAmount || 0) + deliveryFee + tax - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const res = await orderService.validateCoupon(couponCode, totalAmount);
    setApplyingCoupon(false);
    if (res.success) {
      setCouponData(res.data);
      showAlert('Coupon Applied', `Success! You saved ₹${res.data.discount_amount} on this order.`, 'success');
    } else {
      setCouponData(null);
      showAlert('Invalid Coupon', res.error || 'This coupon code is not valid.', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    const effectiveServiceable = selectedAddress 
      ? (selectedAddress.is_serviceable !== undefined ? Boolean(selectedAddress.is_serviceable) : (selectedAddress.isServiceable !== undefined ? Boolean(selectedAddress.isServiceable) : isServiceable))
      : isServiceable;

    if (!effectiveServiceable) {
      showAlert('Service Unavailable', 'We currently don\'t deliver to this address. Please choose another location.', 'error');
      return;
    }

    if (!selectedAddress) {
      showAlert('Where to Deliver?', 'Please select a delivery address to ensure we reach you correctly.', 'warning', [
        { text: 'Later', style: 'cancel' },
        { text: 'Choose Address', onPress: () => { navigation.navigate('SavedAddresses', { selectMode: true }); } },
      ]);
      return;
    }

    if (selectedSlot === 'tomorrow' && !selectedSubSlot) {
      setShowSubSlotPicker(true);
      return;
    }

    setLoading(true);
    try {
      const effectiveStoreId = selectedAddress?.store_id || selectedAddress?.storeId || storeId;
      // Final re-validation before order placement
      const valRes = await cartService.validateCart(items, effectiveStoreId);
      if (valRes.success && (valRes.data?.hasChanges || valRes.data?.has_changes)) {
        setLoading(false);
        const updatedItems = valRes.data.items || [];
        dispatch(updateCartAfterValidation({ items: updatedItems }));
        cartService.syncCart(updatedItems);
        
        const changes = valRes.data.changes || {};
        const removed = changes.removed || [];
        const priceChanged = changes.priceChanged || [];
        const outOfStock = changes.outOfStock || [];

        let msg = "Some items in your cart have changed based on your delivery location:";
        if (removed.length > 0) msg += `\n- ${removed.length} item(s) removed (unavailable).`;
        if (priceChanged.length > 0) msg += `\n- Prices have been updated.`;
        if (outOfStock.length > 0) msg += `\n- Out of stock items adjusted.`;
        
        showAlert('Cart Updated', msg, 'warning');
        return;
      }

      const orderData = {
        store_id: effectiveStoreId,
        items: items.map(item => ({
          product_id: item.id || item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image_url: item.image_url,
          variant_id: item.variant?.id || item.variant_id || item.variantId,
          preferences: {
            cut: item.cutPreference || item.cut_preference,
            cleaning: item.cleaningPreference || item.cleaning_preference
          }
        })),
        subtotal: totalAmount,
        delivery_charge: deliveryFee,
        gst_amount: tax,
        discount_amount: discount,
        coupon_id: couponData?.coupon_id || couponData?.id,
        coupon_code: couponData?.code || couponCode || null,
        total_amount: grandTotal,
        address_id: selectedAddress?.id,
        shipping_address: selectedAddress ? {
          label: selectedAddress.label,
          full_name: selectedAddress.full_name || selectedAddress.fullName,
          phone: selectedAddress.phone,
          address: `${selectedAddress.line1}${selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}`,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode
        } : null,
        delivery_slot: selectedSlot === 'tomorrow' ? (selectedSubSlot?.slot_name || 'Tomorrow') : currentSlot.label,
        delivery_type: selectedSlot,
        delivery_slot_id: selectedSubSlot?.id || null,
        lat: selectedAddress?.latitude || coords?.lat,
        lng: selectedAddress?.longitude || coords?.lng,
        payment_method: paymentMethod
      };

      const orderRes = await orderService.createOrder(orderData);
      if (!orderRes.success) throw new Error(orderRes.error || 'Failed to place order');

      const resolvedOrderId = orderRes.data?.order_id || orderRes.data?.orderId || orderRes.data?.order?.id;

      if (paymentMethod === 'cod') {
        // Direct cash on delivery completion
        dispatch(clearCart());
        cartService.clearCart();
        dispatch(fetchActiveOrder());
        navigation.replace('OrderSuccess', { orderId: resolvedOrderId });
        return;
      }

      // Online payment via Razorpay
      const razorpayOrderId = orderRes.data?.razorpay_order_id || orderRes.data?.razorpayOrderId;
      const razorpayKey = orderRes.data?.razorpay_key_id || orderRes.data?.key || 'rzp_test_ShPQJuXJZUJ1zT';

      const options = {
        description: 'Order Payment',
        image: 'https://dailyfreshkolkata.in/logo.jpg',
        currency: 'INR',
        key: razorpayKey,
        amount: Math.round(grandTotal * 100),
        name: 'Daily Fresh',
        order_id: razorpayOrderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || ''
        },
        theme: { color: activeTheme.primary }
      };

      try {
        const paymentData = await RazorpayCheckout.open(options);

        const verifyRes = await orderService.verifyPayment({
          order_id: resolvedOrderId,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id || razorpayOrderId,
          razorpay_signature: paymentData.razorpay_signature
        });

        if (verifyRes.success) {
          dispatch(clearCart());
          cartService.clearCart();
          dispatch(fetchActiveOrder());
          navigation.replace('OrderSuccess', { orderId: resolvedOrderId });
        } else {
          showAlert('Verification Failed', 'We couldn\'t verify your payment. If money was debited, please contact support.', 'error');
        }
      } catch (rzpErr) {
        console.log('Razorpay modal error / cancelled:', rzpErr);
        showAlert('Payment Incomplete', 'Payment was cancelled or could not be completed. You can choose Cash on Delivery or try again.', 'warning');
      }
    } catch (error) {
      console.log('Order Error:', error);
      const msg = typeof error === 'string' ? error : (error.description || error.message || 'Order could not be placed.');
      if (error.code !== 0) showAlert('Order Failed', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.background }]} edges={['bottom', 'left', 'right']}>
      <StatusBar
        backgroundColor={activeTheme.primary}
        barStyle="light-content"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { backgroundColor: activeTheme.primary, borderBottomWidth: 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: COLORS.white }]}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {selectedAddress && (
                <TouchableOpacity onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}>
                  <Text style={[styles.actionText, { color: activeTheme.primary }]}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedAddress ? (
              <TouchableOpacity 
                style={[styles.addressCard, { borderColor: activeTheme.primary + '40', borderWidth: 1 }]}
                onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: activeTheme.primary + '15', width: 42, height: 42, borderRadius: 21, marginRight: 12 }]}>
                  <Icon name="location" size={24} color={activeTheme.primary} />
                </View>
                <View style={styles.addressInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={styles.addressLabel}>{selectedAddress.label || 'Home'}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray, marginLeft: 8 }}>
                      • {selectedAddress.full_name || selectedAddress.fullName || user?.full_name}
                    </Text>
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, {selectedAddress.city} - {selectedAddress.pincode}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.addressCard, { borderStyle: 'dashed', borderColor: activeTheme.primary }]}
                onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
              >
                <Icon name="location-outline" size={26} color={activeTheme.primary} />
                <View style={styles.addressInfo}>
                  <Text style={[styles.addressLabel, { color: activeTheme.primary }]}>Select Delivery Address</Text>
                  <Text style={styles.addressPlaceholder}>Choose where you want your order delivered</Text>
                </View>
                <Icon name="chevron-forward" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Delivery Window Section */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s }}>
              <Text style={styles.sectionTitle}>Delivery Window</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DeliveryMode')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: activeTheme.primary }}>Change Mode</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[
                styles.confirmationCard, 
                { borderLeftColor: currentSlot.color, borderLeftWidth: 4 }
              ]}
              onPress={() => {
                if (selectedSlot === 'tomorrow') {
                  setShowSubSlotPicker(true);
                } else {
                  navigation.navigate('DeliveryMode');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: currentSlot.color + '15' }]}>
                <Icon name={currentSlot.icon} size={28} color={currentSlot.color} />
              </View>
              <View style={styles.slotDetails}>
                <Text style={styles.slotLabel}>{currentSlot.label}</Text>
                <Text style={styles.slotSub}>
                  {selectedSlot === 'tomorrow' 
                    ? (selectedSubSlot ? (selectedSubSlot.slot_name || selectedSubSlot.slotName) : 'Tap to select time window')
                    : currentSlot.time
                  }
                </Text>
              </View>
              {selectedSlot === 'tomorrow' && (
                <Icon name="chevron-forward" size={24} color={COLORS.gray} />
              )}
            </TouchableOpacity>
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {/* Cash on Delivery */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                paymentMethod === 'cod' && { borderColor: activeTheme.primary, backgroundColor: activeTheme.primary + '08' }
              ]}
              onPress={() => setPaymentMethod('cod')}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconBox, { backgroundColor: '#10B98115' }]}>
                <Icon name="cash-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentOptionTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentOptionSub}>Pay cash or UPI to rider upon delivery</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'cod' && { borderColor: activeTheme.primary }]}>
                {paymentMethod === 'cod' && <View style={[styles.radioInner, { backgroundColor: activeTheme.primary }]} />}
              </View>
            </TouchableOpacity>

            {/* Razorpay Online */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                paymentMethod === 'razorpay' && { borderColor: activeTheme.primary, backgroundColor: activeTheme.primary + '08' }
              ]}
              onPress={() => setPaymentMethod('razorpay')}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconBox, { backgroundColor: '#3B82F615' }]}>
                <Icon name="card-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentOptionTitle}>Online Payment (Razorpay)</Text>
                <Text style={styles.paymentOptionSub}>UPI, Debit/Credit Cards, Net Banking</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'razorpay' && { borderColor: activeTheme.primary }]}>
                {paymentMethod === 'razorpay' && <View style={[styles.radioInner, { backgroundColor: activeTheme.primary }]} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Coupon Code */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Coupons & Offers</Text>
              <TouchableOpacity onPress={fetchCoupons}>
                <Text style={styles.actionText}>View Offers</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.couponContainer}>
              <View style={styles.couponInputWrapper}>
                <Icon name="ticket-outline" size={20} color={activeTheme.primary} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChangeText={(text) => setCouponCode(text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: activeTheme.primary }, (!couponCode || applyingCoupon) && styles.disabledApply]}
                onPress={handleApplyCoupon}
                disabled={!couponCode || applyingCoupon}
              >
                {applyingCoupon ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.applyText}>{couponData ? 'Apply New' : 'Apply'}</Text>
                )}
              </TouchableOpacity>
            </View>
            {couponData && (
              <View style={styles.appliedCoupon}>
                <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.appliedText}>
                  Coupon <Text style={{ fontWeight: '700' }}>{couponData.code}</Text> applied! Saved ₹{couponData.discount_amount}
                </Text>
                <TouchableOpacity onPress={() => { setCouponData(null); setCouponCode(''); }}>
                  <Icon name="close-circle" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Item Total</Text>
                <Text style={styles.summaryValue}>₹{(totalAmount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxes</Text>
                <Text style={styles.summaryValue}>₹{(tax || 0).toFixed(2)}</Text>
              </View>
              {(discount || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Coupon Discount</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>-₹{(discount || 0).toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={[styles.grandTotalValue, { color: activeTheme.primary }]}>₹{(grandTotal || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerTotal}>₹{(grandTotal || 0).toFixed(2)}</Text>
            <Text style={styles.footerSub}>Final Amount</Text>
          </View>
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: activeTheme.primary }, (!selectedAddress || loading) && styles.disabledBtn]}
            onPress={handlePlaceOrder}
            disabled={!selectedAddress || loading}
          >
            {loading ? (
              <LogoLoader size={24} />
            ) : (
              <>
                <Text style={styles.payText}>
                  {paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay & Place Order'}
                </Text>
                <Icon name="chevron-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Available Coupons Modal */}
      {showCouponsModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            activeOpacity={1} 
            onPress={() => setShowCouponsModal(false)} 
          />
          <View pointerEvents="box-none" style={[styles.modalOverlay, { flex: 1 }]}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Offers</Text>
              <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
                <Icon name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={activeTheme.primary} size="large" />
              </View>
            ) : (availableCoupons || []).length > 0 ? (
              <FlatList
                data={availableCoupons || []}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.couponCard}
                    onPress={() => {
                      setCouponCode(item.code);
                      setShowCouponsModal(false);
                      // Trigger apply automatically
                      setTimeout(() => {
                        handleApplyCoupon();
                      }, 500);
                    }}
                  >
                    <View style={styles.couponCardBadge}>
                      <Text style={styles.couponCardCode}>{item.code}</Text>
                    </View>
                    <View style={styles.couponCardInfo}>
                      <Text style={styles.couponCardTitle}>
                        {(item.discount_type || item.discountType) === 'percentage' ? `${item.discount_value || item.discountValue}% OFF` : `₹${item.discount_value || item.discountValue} OFF`}
                      </Text>
                      <Text style={styles.couponCardDesc}>{item.description}</Text>
                      {(item.min_order_amount || item.minOrderAmount) > 0 && (
                        <Text style={styles.couponCardMin}>Min. order ₹{item.min_order_amount || item.minOrderAmount}</Text>
                      )}
                    </View>
                    <Text style={styles.applyAction}>APPLY</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyCoupons}>
                <Icon name="ticket-outline" size={48} color={COLORS.gray} />
                <Text style={styles.emptyCouponsText}>No offers available right now</Text>
              </View>
            )}
          </View>
        </View>
        </View>
      )}

      <SubSlotPicker
        visible={showSubSlotPicker}
        onClose={() => setShowSubSlotPicker(false)}
        onSelect={(slot) => {
          setSelectedSubSlot(slot);
          setShowSubSlotPicker(false);
        }}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.l,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  scroll: { padding: SPACING.l, flexGrow: 1, paddingBottom: 80 },
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: SPACING.m },
  actionText: { color: COLORS.primary, fontWeight: '600' },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.l,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  addressInfo: { flex: 1, marginLeft: SPACING.m },
  addressLabel: { fontWeight: '700', color: COLORS.dark, fontSize: 14 },
  addressText: { color: COLORS.gray, fontSize: 13, marginTop: 2 },
  addressPlaceholder: { color: COLORS.gray, fontStyle: 'italic' },
  confirmationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.l,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  slotDetails: {
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  slots: { gap: 12 },
  slotGroup: { marginBottom: 16 },
  slotGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4
  },
  slot: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  activeSlot: { borderColor: COLORS.primary, backgroundColor: '#f0f9ff' },
  slotRadio: { marginRight: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  slotText: { flex: 1 },
  slotLabel: { fontWeight: '800', color: '#0F172A', fontSize: 15 },
  slotSub: { fontSize: 12, color: '#334155', fontWeight: '500', marginTop: 2 },
  summaryCard: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card },
  noSlotsCard: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: SPACING.l,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  noSlotsText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18
  },
  couponContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    overflow: 'hidden'
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledApply: {
    backgroundColor: '#e2e8f0',
  },
  applyText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    gap: 8
  },
  appliedText: {
    flex: 1,
    fontSize: 12,
    color: '#166534'
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.m },
  summaryLabel: { color: COLORS.gray },
  summaryValue: { fontWeight: '600', color: COLORS.dark },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: SPACING.m, marginTop: SPACING.s },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  footerTotal: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  footerSub: { fontSize: 12, color: COLORS.gray },
  payBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    gap: 8
  },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  payText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark
  },
  modalLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'
  },
  couponCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 4,
    marginRight: 12
  },
  couponCardCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success
  },
  couponCardInfo: {
    flex: 1
  },
  couponCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark
  },
  couponCardDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2
  },
  couponCardMin: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '600'
  },
  applyAction: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 8
  },
  emptyCoupons: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyCouponsText: {
    marginTop: 16,
    color: COLORS.gray,
    fontSize: 15,
    textAlign: 'center'
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  paymentOptionSub: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  }
});

export default CheckoutScreen;
