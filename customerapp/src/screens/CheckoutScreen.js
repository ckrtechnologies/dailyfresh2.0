import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
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

  // Constants (should ideally come from settings, but using defaults for now)
  const gstRate = 12;
  const deliveryFee = totalAmount >= 499 ? 0 : 30;
  const tax = totalAmount * (gstRate / 100);
  const grandTotal = totalAmount + deliveryFee + tax;

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
        total_amount: grandTotal,
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
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  payText: { color: COLORS.white, fontWeight: '700', fontSize: 15 }
});

export default CheckoutScreen;
