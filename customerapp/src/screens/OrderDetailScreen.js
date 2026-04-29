import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/slices/cartSlice';
import LogoLoader from '../components/LogoLoader';
import orderService from '../api/orderService';

const OrderDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { order: initialOrder, orderId } = route.params || {};
  console.log('[OrderDetail] Params:', JSON.stringify(route.params, null, 2));
  const [order, setOrder] = useState(initialOrder || (orderId ? { id: orderId } : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    const id = orderId || order?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error('[OrderDetail] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LogoLoader fullScreen />;
  if (!order) return (
    <View style={styles.centerContainer}>
      <Icon name="alert-circle-outline" size={48} color={COLORS.gray} />
      <Text style={styles.errorText}>Order not found</Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#4CAF50';
      case 'accepted': return '#4CAF50';
      case 'confirmed': return '#2196F3'; // Blue for payment confirmed
      case 'pending': return '#FF9800';
      case 'preparing': return '#2196F3';
      case 'out_for_delivery': return '#9C27B0';
      case 'cancelled': return '#F44336';
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
  };

  const StatusStep = ({ title, date, active, completed, last, cancelled }) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepCircle, 
          completed && { backgroundColor: cancelled ? COLORS.error : COLORS.primary },
          active && { borderColor: cancelled ? COLORS.error : COLORS.primary, borderWidth: 2, backgroundColor: COLORS.white }
        ]}>
          {completed ? (
            <Icon name={cancelled ? "close" : "check"} size={14} color={COLORS.white} />
          ) : (
            <View style={[styles.stepDot, active && { backgroundColor: cancelled ? COLORS.error : COLORS.primary }]} />
          )}
        </View>
        {!last && <View style={[styles.stepLine, completed && { backgroundColor: cancelled ? COLORS.error : COLORS.primary }]} />}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, active && { color: cancelled ? COLORS.error : COLORS.primary, fontWeight: '700' }]}>
          {title}
        </Text>
        {date && <Text style={styles.stepDate}>{date}</Text>}
      </View>
    </View>
  );

  const handleShare = async () => {
    try {
      const itemsText = order.items.map(it => `- ${it.name} (x${it.quantity})`).join('\n');
      await Share.share({
        message: `My Daily Fresh order #${order.order_number} is ${order.status}!\n\nItems:\n${itemsText}\n\nTotal: ₹${order.total_amount}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorder = () => {
    try {
      order.items.forEach(item => {
        // Wrap in the structure cartSlice expects
        const payload = {
          product: {
            id: item.product_id,
            name: item.name,
            price: item.unit_price || item.price,
            image_url: item.product?.image_url,
            weight: item.weight || item.product?.weight,
          },
          quantity: item.quantity,
          variant: item.variant_id ? { id: item.variant_id, name: item.name } : null,
          cutPreference: item.preferences?.cut || null,
          cleaningPreference: item.preferences?.cleaning || null
        };
        dispatch(addItem(payload));
      });
      
      // Navigate to Cart
      navigation.navigate('AppTabs', { screen: 'Cart' });
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  const isCancelled = order.status === 'cancelled';
  const orderSteps = [
    { id: 'pending', title: 'Order Placed', statuses: ['pending', 'confirmed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'] },
    { id: 'accepted', title: 'Accepted', statuses: ['confirmed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'] },
    { id: 'preparing', title: 'Preparing', statuses: ['preparing', 'out_for_delivery', 'delivered'] },
    { id: 'out_for_delivery', title: 'Out for Delivery', statuses: ['out_for_delivery', 'delivered'] },
    { id: 'delivered', title: 'Delivered', statuses: ['delivered'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.helpBtn} onPress={handleShare}>
            <Icon name="share-variant" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn}>
            <Icon name="help-circle-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Order Status Summary */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderIdText}>Order #{order.order_number}</Text>
              <Text style={styles.storeText}>{order.store?.name || 'Daily Fresh Store'}</Text>
              <Text style={styles.orderTimeText}>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })} • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.trackingContainer}>
            {isCancelled ? (
              <StatusStep 
                title="Order Cancelled" 
                date={new Date(order.updated_at || order.created_at).toLocaleString()} 
                active 
                completed 
                cancelled
                last
              />
            ) : (
              orderSteps.map((step, index) => (
                <StatusStep 
                  key={step.id}
                  title={step.title}
                  active={order.status === step.id}
                  completed={step.statuses.includes(order.status)}
                  last={index === orderSteps.length - 1}
                />
              ))
            )}
          </View>
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.itemRow, index === (order.items?.length || 0) - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: item.product?.image_url || 'https://via.placeholder.com/100' }} 
                style={styles.itemImage} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                {/* Show variant name or customization if available, otherwise fallback to item name */}
                <Text style={styles.itemName}>
                  {item.variant?.name || (item.preferences?.cut ? `${item.preferences.cut}` : item.name)}
                </Text>
                {item.preferences && (item.preferences.cut || item.preferences.cleaning) && (
                  <Text style={styles.itemPref}>
                    {item.preferences.cut && item.preferences.cut !== (item.variant?.name || item.name) ? `${item.preferences.cut} Cut` : ''}
                    {item.preferences.cleaning && item.preferences.cleaning !== (item.variant?.name || item.name) ? (item.preferences.cut ? `, ${item.preferences.cleaning}` : item.preferences.cleaning) : ''}
                  </Text>
                )}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.total_price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Icon name="map-marker-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              {/* Label if available */}
              {((Array.isArray(order.delivery_address) ? order.delivery_address[0]?.label : order.delivery_address?.label) || order.address_label || order.shipping_address?.label) && (
                <Text style={styles.addressLabel}>
                  {(Array.isArray(order.delivery_address) ? order.delivery_address[0]?.label : order.delivery_address?.label) || order.address_label || order.shipping_address?.label}
                </Text>
              )}
              <Text style={styles.addressText}>
                {(() => {
                  const addr = Array.isArray(order.delivery_address) ? order.delivery_address[0] : order.delivery_address;
                  if (addr) {
                    return `${addr.line1 || addr.address_line1 || ''}${addr.line2 ? `\n${addr.line2}` : ''}${addr.city ? `\n${addr.city}${addr.pincode ? ' - ' + addr.pincode : ''}` : ''}`;
                  }
                  if (order.shipping_address) {
                    return `${order.shipping_address.address || ''}\n${order.shipping_address.city || ''} - ${order.shipping_address.pincode || ''}`;
                  }
                  return order.address_line1 || order.address || 'No address on record';
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{order.total_items_price || (order.total_amount - order.delivery_charge - order.gst_amount)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{order.delivery_charge || 0}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes (GST)</Text>
            <Text style={styles.billValue}>₹{order.gst_amount || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Total Amount Paid</Text>
            <Text style={styles.totalValue}>₹{order.total_amount}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Icon name={order.payment_method === 'cod' ? 'cash' : 'credit-card-outline'} size={16} color={COLORS.gray} />
            <Text style={styles.paymentMethodText}>
              Paid via {order.payment_method.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Reorder Button */}
        <TouchableOpacity 
          style={styles.reorderBtn}
          onPress={handleReorder}
        >
          <Icon name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.reorderBtnText}>Reorder Now</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  helpBtn: {
    padding: SPACING.s,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl * 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.l,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  storeText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  orderTimeText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackingContainer: {
    marginLeft: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    height: 60,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 30,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.white,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: -2,
  },
  stepContent: {
    marginLeft: 12,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  stepDate: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.m,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.s,
    backgroundColor: '#F9FAFB',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  itemPref: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  billValue: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  paymentMethodText: {
    fontSize: 11,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reorderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: RADIUS.l,
    gap: 8,
  },
  reorderBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OrderDetailScreen;
