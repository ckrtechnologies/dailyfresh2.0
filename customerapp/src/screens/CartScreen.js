import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { addItem, removeItem, clearCart } from '../store/slices/cartSlice';
import { setSelectedAddress } from '../store/slices/locationSlice';
import productService from '../api/productService';
import addressService from '../api/addressService';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { address, selectedAddress } = useSelector((state) => state.location);
  
  const [gstRate, setGstRate] = useState(12);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const flatListRef = useRef(null);

  const FREE_DELIVERY_THRESHOLD = 499;

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
            dispatch(setSelectedAddress(defaultAddr));
          }
        }
      } catch (error) {
        console.log('Initial data fetch error:', error);
      }
    };
    fetchInitialData();
  }, []);

  const currentDeliveryFee = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryFee;
  const tax = totalAmount * (gstRate / 100);
  const grandTotal = totalAmount + currentDeliveryFee + tax;

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemWeight}>{item.weight_unit || '500g pack'}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(removeItem(item.id))}>
          <Icon name="minus" size={20} color={COLORS.primary} />

        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(addItem(item))}>
          <Icon name="plus" size={20} color={COLORS.primary} />

        </TouchableOpacity>
      </View>
    </View>
  );

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
        <TouchableOpacity onPress={() => dispatch(clearCart())}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <View style={styles.addressTitleRow}>
                <Icon name="map-marker-radius" size={20} color={COLORS.primary} />
                <Text style={styles.addressTitle}>Delivery To</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}>
                <Text style={styles.changeText}>CHANGE</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress ? `${selectedAddress.line1}, ${selectedAddress.city}` : (address || 'Pick an address')}
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.billContainer}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <View style={styles.billRow}><Text style={styles.billLabel}>Item Total</Text><Text style={styles.billValue}>₹{totalAmount.toFixed(2)}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={[styles.billValue, currentDeliveryFee === 0 && { color: COLORS.primary }]}>{currentDeliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text></View>
            <View style={styles.billRow}><Text style={styles.billLabel}>Taxes</Text><Text style={styles.billValue}>₹{tax.toFixed(2)}</Text></View>
            <View style={[styles.billRow, styles.totalRow]}><Text style={styles.totalLabel}>Grand Total</Text><Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text></View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.footerSub}>Incl. all taxes</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Icon name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.l, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  clearText: { color: '#FF3B30', fontWeight: '600' },
  list: { padding: SPACING.m },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.card, padding: SPACING.m, marginBottom: SPACING.m, alignItems: 'center' },
  itemImage: { width: 70, height: 70, borderRadius: RADIUS.s, backgroundColor: '#f1f5f9' },
  itemInfo: { flex: 1, marginLeft: SPACING.m },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  itemWeight: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(125, 180, 52, 0.1)', borderRadius: RADIUS.s, borderWidth: 1, borderColor: COLORS.primary },
  qtyBtn: { padding: 6 },
  quantity: { paddingHorizontal: 8, fontWeight: '700', color: COLORS.primary, fontSize: 16 },
  addressSection: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.m },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  changeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  addressText: { color: COLORS.gray, fontSize: 13 },
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
  checkoutBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: RADIUS.m, alignItems: 'center', gap: 8 },
  checkoutText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: COLORS.white },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginTop: 20 },
  emptySubtitle: { textAlign: 'center', color: COLORS.gray, marginTop: 10, marginBottom: 30 },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: RADIUS.l },
  shopText: { color: COLORS.white, fontWeight: '700' }
});

export default CartScreen;
