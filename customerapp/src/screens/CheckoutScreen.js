import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RazorpayCheckout from 'react-native-razorpay';
import Config from 'react-native-config';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { clearCart } from '../store/slices/cartSlice';
import { fetchActiveOrder } from '../store/slices/orderSlice';
import orderService from '../api/orderService';
import LogoLoader from '../components/LogoLoader';

const DELIVERY_SLOTS = [
  { id: 'express', label: 'Express Delivery (90 mins)', subLabel: 'Immediate delivery', type: 'express' },
  // Today Slots
  { id: 'today_morning', label: 'Today (9 AM - 12 PM)', subLabel: 'Morning Delivery', type: 'morning' },
  { id: 'today_afternoon', label: 'Today (12 PM - 6 PM)', subLabel: 'Afternoon Delivery', type: 'afternoon' },
  // Tomorrow Slots
  { id: 'tom_morning', label: 'Tomorrow (9 AM - 12 PM)', subLabel: 'Morning Delivery', type: 'morning' },
  { id: 'tom_afternoon', label: 'Tomorrow (12 PM - 6 PM)', subLabel: 'Afternoon Delivery', type: 'afternoon' },
];

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { address, pincode, storeId, coords, selectedAddress } = useSelector((state) => state.location);
  
  // Calculate allowed slots based on product restrictions and current time
  const getFilteredSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return DELIVERY_SLOTS.filter(slot => {
      // 1. Product Restriction Check
      const isProductCompatible = items.every(item => {
        const productOptions = item.delivery_options || ['morning', 'afternoon', 'evening', 'express'];
        return productOptions.includes(slot.type);
      });

      if (!isProductCompatible) return false;

      // 2. Time-based Check for "Today" slots
      if (slot.id === 'today_morning') {
        // Available only if ordered before 9 AM
        return currentHour < 9;
      }

      if (slot.id === 'today_afternoon') {
        // Available only if ordered before 12 PM
        return currentHour < 12;
      }

      // Express is always available if product supports it
      // Tomorrow slots are always available

      return true;
    });
  };

  const allowedSlots = getFilteredSlots();

  const [selectedSlot, setSelectedSlot] = useState(allowedSlots.length > 0 ? allowedSlots[0].id : null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    setShowCouponsModal(true);
    const res = await orderService.getAvailableCoupons();
    if (res.success) {
      setAvailableCoupons(res.data.coupons || []);
    }
    setLoadingCoupons(false);
  };

  // Constants
  const gstRate = 12;
  const deliveryFee = totalAmount >= 499 ? 0 : 30;
  const tax = totalAmount * (gstRate / 100);
  const discount = couponData ? couponData.discount_amount : 0;
  const grandTotal = Math.max(0, totalAmount + deliveryFee + tax - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const res = await orderService.validateCoupon(couponCode, totalAmount);
    setApplyingCoupon(false);
    if (res.success) {
      setCouponData(res.data);
      Alert.alert('Success', `Coupon applied! You saved ₹${res.data.discount_amount}`);
    } else {
      setCouponData(null);
      Alert.alert('Invalid Coupon', res.error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        store_id: storeId,
        items: items.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: totalAmount,
        delivery_charge: deliveryFee,
        gst_amount: tax,
        discount_amount: discount,
        coupon_id: couponData?.coupon_id,
        total_amount: grandTotal,
        address_id: selectedAddress.id, // Add this so backend links the address
        shipping_address: {
          label: selectedAddress.label,
          full_name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          address: `${selectedAddress.line1}${selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}`,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode
        },
        delivery_slot: DELIVERY_SLOTS.find(s => s.id === selectedSlot).label,
        lat: selectedAddress.latitude || coords?.lat,
        lng: selectedAddress.longitude || coords?.lng,
        payment_method: 'razorpay'
      };

      const orderRes = await orderService.createOrder(orderData);
      if (!orderRes.success) throw new Error(orderRes.error);

      // Trigger tracking bar immediately after order is initiated in DB
      dispatch(fetchActiveOrder());

      const { razorpay_order_id, order_id } = orderRes.data;
      const razorpayKey = (Config && Config.RAZORPAY_KEY_ID) || 'rzp_test_ShPQJuXJZUJ1zT';

      const options = {
        description: 'Order Payment',
        image: 'https://dailyfreshkolkata.in/logo.jpg',
        currency: 'INR',
        key: razorpayKey,
        amount: Math.round(grandTotal * 100),
        name: 'Daily Fresh',
        order_id: razorpay_order_id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || ''
        },
        theme: { color: COLORS.primary }
      };

      const paymentData = await RazorpayCheckout.open(options);
      
      const verifyRes = await orderService.verifyPayment({
        order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id || razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature
      });

      if (verifyRes.success) {
        dispatch(clearCart());
        dispatch(fetchActiveOrder()); // Refresh with 'confirmed' status
        navigation.replace('OrderSuccess', { orderId: order_id });
      } else {
        Alert.alert('Payment Verification Failed', 'Please contact support.');
      }
    } catch (error) {
      console.log('Order Error:', error);
      const msg = typeof error === 'string' ? error : (error.description || 'Order could not be placed.');
      if (error.code !== 0) Alert.alert('Payment Cancelled', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Address Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}>
              <Text style={styles.actionText}>{selectedAddress ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.addressCard}
            onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
          >
            <Icon name="map-marker" size={24} color={COLORS.primary} />
            <View style={styles.addressInfo}>
              {selectedAddress ? (
                <>
                  <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                  <Text style={styles.addressText}>{selectedAddress.line1}, {selectedAddress.city}</Text>
                </>
              ) : (
                <Text style={styles.addressPlaceholder}>Select a delivery address</Text>
              )}
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          <View style={styles.slots}>
            {allowedSlots.length > 0 ? (
              ['Express', 'Today', 'Tomorrow'].map((category) => {
                const categorySlots = allowedSlots.filter(s => {
                  if (category === 'Express') return s.type === 'express';
                  if (category === 'Today') return s.id.startsWith('today_');
                  if (category === 'Tomorrow') return s.id.startsWith('tom_');
                  return false;
                });

                if (categorySlots.length === 0) return null;

                return (
                  <View key={category} style={styles.slotGroup}>
                    <Text style={styles.slotGroupTitle}>{category}</Text>
                    {categorySlots.map(slot => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.slot, selectedSlot === slot.id && styles.activeSlot]}
                        onPress={() => setSelectedSlot(slot.id)}
                      >
                        <View style={styles.slotRadio}>
                           <View style={[styles.radioOuter, selectedSlot === slot.id && styles.radioActive]}>
                              {selectedSlot === slot.id && <View style={styles.radioInner} />}
                           </View>
                        </View>
                        <View style={styles.slotText}>
                          <Text style={styles.slotLabel}>{slot.label}</Text>
                          <Text style={styles.slotSub}>{slot.subLabel}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })
            ) : (
              <View style={styles.noSlotsCard}>
                <Icon name="alert-circle-outline" size={24} color={COLORS.error} />
                <Text style={styles.noSlotsText}>
                  The items in your cart have conflicting delivery options or it's too late for today's slots. Please try ordering separately or choosing a tomorrow slot.
                </Text>
              </View>
            )}
          </View>
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
              <Icon name="ticket-percent-outline" size={20} color={COLORS.primary} style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.couponInput}
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChangeText={(text) => setCouponCode(text.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity 
              style={[styles.applyBtn, (!couponCode || applyingCoupon) && styles.disabledApply]} 
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
              <Icon name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.appliedText}>
                Coupon <Text style={{fontWeight:'700'}}>{couponData.code}</Text> applied! Saved ₹{couponData.discount_amount}
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
              <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes</Text>
              <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Coupon Discount</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>-₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Available Coupons Modal */}
      <Modal
        visible={showCouponsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Offers</Text>
              <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
                <Icon name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={COLORS.primary} size="large" />
              </View>
            ) : availableCoupons.length > 0 ? (
              <FlatList
                data={availableCoupons}
                keyExtractor={(item) => item.id}
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
                        {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `₹${item.discount_value} OFF`}
                      </Text>
                      <Text style={styles.couponCardDesc}>{item.description}</Text>
                      {item.min_order_amount > 0 && (
                         <Text style={styles.couponCardMin}>Min. order ₹{item.min_order_amount}</Text>
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
      </Modal>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.footerSub}>Final Amount</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payBtn, (!selectedAddress || !selectedSlot || loading) && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || !selectedSlot || loading}
        >
          {loading ? (
            <LogoLoader size={24} />
          ) : (
            <>
              <Text style={styles.payText}>Pay & Place Order</Text>
              <Icon name="chevron-right" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scroll: { padding: SPACING.l },
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
  slotLabel: { fontWeight: '600', color: COLORS.dark, fontSize: 14 },
  slotSub: { fontSize: 11, color: COLORS.gray },
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
  }
});

export default CheckoutScreen;
