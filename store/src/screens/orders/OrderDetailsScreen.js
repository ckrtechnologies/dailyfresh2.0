import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import { storeApi } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function OrderDetailsScreen({ route, navigation }) {
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(!order);
  const orderId = route.params?.orderId;

  useEffect(() => {
    if (!order && orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await storeApi.getOrders({ search: orderId });
      if (response.data?.success && response.data.data.orders.length > 0) {
        setOrder(response.data.data.orders[0]);
      }
    } catch (error) {
      console.error('Fetch order details error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setLoading(true);
      const response = await storeApi.updateOrderStatus(order.id, newStatus);
      if (response.data?.success) {
        setOrder({ ...order, status: newStatus });
        Toast?.show?.({ type: 'success', text1: 'Success', text2: `Order ${newStatus.replace(/_/g, ' ')}` });
      }
    } catch (error) {
      console.error('Update status error', error);
      Toast?.show?.({ type: 'error', text1: 'Error', text2: 'Failed to update status' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return '#FF9800'; // Orange
      case 'confirmed': return '#10b981'; // Green
      case 'preparing': return '#2196F3'; // Blue
      case 'ready': return '#6366f1'; // Indigo
      case 'out_for_delivery': return '#9C27B0'; // Purple
      case 'delivered': return '#2E7D32'; // Dark Green
      case 'cancelled': return '#F44336'; // Red
      default: return COLORS.gray;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: COLORS.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered = order.status === 'delivered';
  const dateStr = new Date(order.created_at).toLocaleDateString() + ' ' + new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemImageThumb}>
        {item.product?.image_url ? (
          <Image source={{ uri: item.product.image_url }} style={styles.thumbImg} />
        ) : (
          <Icon name="package-variant" size={20} color={COLORS.gray} />
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name || item.product?.name || `Product #${item.product_id}`}</Text>
        <Text style={styles.itemPrice}>₹{item.unit_price || item.price} × {item.quantity}</Text>
      </View>
      <Text style={styles.itemTotal}>₹{item.total_price || (item.price * item.quantity)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Order ID</Text>
            <Text style={styles.pairValue}>{order.order_number || order.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Date</Text>
            <Text style={styles.pairValue}>{dateStr}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Delivery Slot</Text>
            <Text style={styles.pairValue}>
              {order.delivery_slot || 'N/A'}
            </Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Delivery Type</Text>
            <View style={[styles.typeBadge, { 
              backgroundColor: order.delivery_type === 'express' ? '#ffe4e1' : 
                               order.delivery_type === 'tomorrow_morning' ? '#f0fdfa' : '#eff6ff' 
            }]}>
              <Text style={[styles.typeText, { 
                color: order.delivery_type === 'express' ? '#cd5c5c' : 
                       order.delivery_type === 'tomorrow_morning' ? '#0d9488' : '#1e40af' 
              }]}>
                {(order.delivery_type || 'scheduled').replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Customer Name</Text>
            <Text style={styles.pairValue}>{order.customer?.full_name || 'N/A'}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Customer Phone</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer?.phone || order.customer_phone}`)}>
              <Text style={[styles.pairValue, { color: COLORS.primary, textDecorationLine: 'underline' }]}>
                {order.customer?.phone || order.customer_phone || 'N/A'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.pairRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.pairLabel}>Delivery Address</Text>
            <Text style={[styles.pairValue, { flex: 1, textAlign: 'right' }]}>{order.shipping_address || order.delivery_address || 'No address provided'}</Text>
          </View>
          {order.latitude && order.longitude && (
            <View style={styles.pairRow}>
              <Text style={styles.pairLabel}>GPS Location</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`geo:${order.latitude},${order.longitude}?q=${order.latitude},${order.longitude}`)}>
                <Text style={[styles.pairValue, { color: COLORS.primary, textDecorationLine: 'underline' }]}>View on Map</Text>
              </TouchableOpacity>
            </View>
          )}
          {order.customer_notes && (
            <View style={[styles.pairRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.pairLabel}>Customer Notes</Text>
              <Text style={[styles.pairValue, { flex: 1, textAlign: 'right', fontStyle: 'italic' }]}>"{order.customer_notes}"</Text>
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => (
            <View key={item.id || index.toString()}>
              {renderItem({ item })}
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Items Price</Text>
            <Text style={styles.pairValue}>₹{order.total_items_price || 0}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Delivery Charge</Text>
            <Text style={styles.pairValue}>₹{order.delivery_charge || 0}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>GST Amount</Text>
            <Text style={styles.pairValue}>₹{order.gst_amount || 0}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Discount</Text>
            <Text style={[styles.pairValue, { color: COLORS.success }]}>- ₹{order.discount_amount || 0}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pairRow}>
            <Text style={[styles.pairLabel, { fontWeight: 'bold', color: COLORS.dark }]}>Total Amount</Text>
            <Text style={[styles.pairValue, { fontWeight: 'bold', color: COLORS.primary, fontSize: 18 }]}>₹{order.total_amount}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Payment Method</Text>
            <Text style={styles.pairValue}>{order.payment_method?.toUpperCase() || 'N/A'}</Text>
          </View>
          <View style={styles.pairRow}>
            <Text style={styles.pairLabel}>Payment Status</Text>
            <View style={[styles.paymentBadge, { backgroundColor: order.payment_status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
              <Text style={[styles.paymentText, { color: order.payment_status === 'completed' ? COLORS.success : COLORS.warning }]}>
                {order.payment_status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isDelivered && order.status !== 'cancelled' && (
          <View style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.actionButtons}>
              {order.status === 'placed' && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#10b981' }]} onPress={() => handleUpdateStatus('confirmed')}>
                  <Icon name="check-circle" size={20} color={COLORS.white} />
                  <Text style={styles.statusBtnText}>Confirm Order</Text>
                </TouchableOpacity>
              )}
              {order.status === 'confirmed' && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#3b82f6' }]} onPress={() => handleUpdateStatus('preparing')}>
                  <Icon name="pot-steam" size={20} color={COLORS.white} />
                  <Text style={styles.statusBtnText}>Start Packing</Text>
                </TouchableOpacity>
              )}
              {order.status === 'preparing' && (
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#6366f1' }]} onPress={() => handleUpdateStatus('ready')}>
                  <Icon name="package-variant" size={20} color={COLORS.white} />
                  <Text style={styles.statusBtnText}>Mark as Ready</Text>
                </TouchableOpacity>
              )}
              {order.status === 'ready' && (
                <View style={styles.waitingRider}>
                  <Icon name="clock-outline" size={20} color={COLORS.gray} />
                  <Text style={styles.waitingText}>Waiting for Rider</Text>
                </View>
              )}

              {['placed', 'confirmed', 'preparing', 'ready'].includes(order.status) && (
                <TouchableOpacity style={styles.cancelActionBtn} onPress={() => handleUpdateStatus('cancelled')}>
                  <Text style={styles.cancelActionText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.error, marginBottom: SPACING.m },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.l, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { marginRight: SPACING.m },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  scrollContent: { padding: SPACING.m },
  card: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.m, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  orderId: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  orderDate: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.badge },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: SPACING.m },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.m, gap: SPACING.s },
  infoText: { flex: 1, fontSize: 15, color: COLORS.dark, lineHeight: 22 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  itemInfo: { flex: 1, marginRight: SPACING.m },
  itemName: { fontSize: 15, color: COLORS.dark, fontWeight: '500', marginBottom: 4 },
  itemPrice: { fontSize: 13, color: COLORS.gray },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: COLORS.dark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.m },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  pairLabel: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  pairValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.badge },
  paymentText: { fontSize: 10, fontWeight: 'bold' },
  itemImageThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  actionCard: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.xl, borderTopWidth: 4, borderTopColor: COLORS.primary },
  actionButtons: { gap: SPACING.m, marginTop: SPACING.s },
  statusBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.m, borderRadius: RADIUS.button, gap: 8 },
  statusBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  cancelActionBtn: { padding: SPACING.m, alignItems: 'center' },
  cancelActionText: { color: COLORS.error, fontWeight: '600' },
  waitingRider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.m, backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button, gap: 8 },
  waitingText: { color: COLORS.gray, fontWeight: '500' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '800' }
});
