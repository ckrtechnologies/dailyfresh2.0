import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { ShoppingBag, Calendar, MapPin, ChevronRight, Clock, Filter, CheckCircle2, Package, XCircle, User, Phone, Mail, Hash, IndianRupee, Navigation } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setHistory } from '../store/orderSlice';
import { setDateRange } from '../store/dateRangeSlice';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const OrdersScreen = ({ route }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [fetching, setFetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { history: orders, historyPagination } = useSelector((state) => state.orders);
  const { startDate, endDate, label: dateLabel } = useSelector((state) => state.dateRange);

  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    if (route?.params?.selectedOrderId) {
      fetchOrderDetails(route.params.selectedOrderId);
    }
    if (route?.params?.status) {
      setStatusFilter(route.params.status);
    }
  }, [route?.params]);

  const fetchOrderHistory = useCallback(async (page = 1) => {
    setFetching(true);
    try {
      // If status is 'ready', fetch from available pool, otherwise history
      const endpoint = statusFilter === 'ready' ? '/rider/orders/available' : '/rider/orders/history';
      const res = await api.get(endpoint, {
        params: { startDate, endDate, status: statusFilter, page, pageSize: 20 }
      });
      if (res.data && res.data.success) {
        dispatch(setHistory(res.data.data));
      }
    } catch (err) {
      console.error('Fetch History Error:', err);
    } finally {
      setFetching(false);
    }
  }, [startDate, endDate, statusFilter, dispatch]);

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  const fetchOrderDetails = async (orderId) => {
    setLoadingDetails(true);
    setShowDetails(true);
    try {
      const res = await api.get(`/rider/orders/${orderId}`);
      if (res.data && res.data.success) {
        setSelectedOrder(res.data.data.order);
      }
    } catch (err) {
      console.error('Fetch Details Error:', err);
      Alert.alert('Error', 'Failed to fetch order details');
      setShowDetails(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder?.id) return;
    setAcceptLoading(true);
    try {
      const res = await api.post('/rider/orders/accept', { orderId: selectedOrder.id });
      if (res.data.success) {
        setShowDetails(false);
        navigation.navigate('Dashboard', { 
          screen: 'ActiveDelivery', 
          params: { order: res.data.data.order } 
        });
      }
    } catch (err) {
      console.error('Accept Order Error:', err);
      Alert.alert('Error', 'Failed to accept order. It may have been taken by another rider.');
    } finally {
      setAcceptLoading(false);
    }
  };

  const quickFilters = [
    { label: 'Today', getValue: () => ({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }) },
    {
      label: 'Yesterday', getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const date = d.toISOString().split('T')[0];
        return { startDate: date, endDate: date };
      }
    },
    {
      label: 'Last 7 Days', getValue: () => {
        const end = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const start = d.toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    },
  ];

  const handleFilterPress = (filter) => {
    const range = filter.getValue();
    dispatch(setDateRange({ ...range, label: filter.label }));
  };

  const handleCustomDateApply = () => {
    dispatch(setDateRange({ startDate: tempStartDate, endDate: tempEndDate, label: 'Custom' }));
    setShowDatePicker(false);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'ready': return { label: 'Pending Pickup', color: '#f59e0b', icon: Package };
      case 'delivered': return { color: '#10b981', label: 'Delivered', icon: CheckCircle2 };
      case 'cancelled': return { color: '#ef4444', label: 'Cancelled', icon: XCircle };
      case 'accepted': return { color: '#3b82f6', label: 'Accepted', icon: Package };
      case 'out_for_delivery':
      case 'picked_up': return { color: '#f59e0b', label: 'In Transit', icon: Clock };
      default: return { color: '#64748b', label: status, icon: ShoppingBag };
    }
  };

  const handleNavigate = async (lat, lng) => {
    try {
      if (!lat || !lng) {
        Alert.alert('Missing Location', 'Coordinates for this location are not available.');
        return;
      }
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      try {
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert('Navigation Error', 'Could not open map application.');
      }
    } catch (err) {
      Alert.alert('Navigation Error', 'Could not launch map application.');
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => fetchOrderDetails(item.original_id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderType}>
            <View style={[styles.iconBox, { backgroundColor: `${statusInfo.color}15` }]}>
              <statusInfo.icon color={statusInfo.color} size={16} />
            </View>
            <View>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={styles.orderStore}>{item.store}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}15` }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderMeta}>
          <View style={styles.metaItem}>
            <Calendar color="#94a3b8" size={14} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <ChevronRight color="#cbd5e1" size={18} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>Order History</Text>
            <Text style={styles.headerSub}>Showing {orders.length} deliveries</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Filter color="#3b82f6" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                onPress={() => handleFilterPress(filter)}
                style={[
                  styles.filterChip,
                  dateLabel === filter.label && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  dateLabel === filter.label && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={[styles.filterRow, { paddingTop: 0, paddingBottom: 16 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'ready', 'accepted', 'picked_up', 'delivered'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.statusChip,
                  statusFilter === status && styles.statusChipActive
                ]}
              >
                <Text style={[
                  styles.statusChipText,
                  statusFilter === status && styles.statusChipTextActive
                ]}>
                  {status === 'ready' ? 'Pending' : status === 'picked_up' ? 'Transit' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.original_id || item.id}
        contentContainerStyle={styles.list}
        refreshing={fetching}
        onRefresh={fetchOrderHistory}
        ListEmptyComponent={
          !fetching && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <ShoppingBag color="#cbd5e1" size={48} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySub}>Try changing the date range</Text>
            </View>
          )
        }
      />

      {/* ORDER DETAILS MODAL */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <XCircle color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Fetching details...</Text>
              </View>
            ) : selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* STATUS BAR */}
                <View style={styles.statusBanner}>
                  <View style={[styles.statusPoint, { backgroundColor: getStatusInfo(selectedOrder.status).color }]} />
                  <Text style={[styles.statusBannerText, { color: getStatusInfo(selectedOrder.status).color }]}>
                    {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.orderNumberText}>#{selectedOrder.order_number}</Text>
                </View>

                {/* CUSTOMER SECTION */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.infoLine}>
                      <User color="#64748b" size={16} />
                      <Text style={styles.infoVal}>{selectedOrder.customer?.full_name}</Text>
                    </View>
                    <View style={styles.infoLine}>
                      <Phone color="#64748b" size={16} />
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.infoVal}>{selectedOrder.customer?.phone}</Text>
                        <TouchableOpacity 
                          onPress={() => Linking.openURL(`tel:${selectedOrder.customer?.phone}`)}
                          style={styles.actionIconBtn}
                        >
                          <Phone color="#3b82f6" size={18} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.infoLine}>
                      <MapPin color="#64748b" size={16} />
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.infoVal, { flex: 1 }]}>{selectedOrder.address?.line1}, {selectedOrder.address?.city}</Text>
                        <TouchableOpacity 
                          onPress={() => handleNavigate(selectedOrder.address?.latitude, selectedOrder.address?.longitude)}
                          style={styles.actionIconBtn}
                        >
                          <Navigation color="#3b82f6" size={18} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ITEMS SECTION */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {selectedOrder.items?.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₹{item.total_price}</Text>
                    </View>
                  ))}
                </View>

                {/* BILLING SECTION */}
                <View style={styles.section}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Subtotal</Text>
                    <Text style={styles.billVal}>₹{selectedOrder.total_items_price}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery Charge</Text>
                    <Text style={styles.billVal}>₹{selectedOrder.delivery_charge}</Text>
                  </View>
                  <View style={[styles.billRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalVal}>₹{selectedOrder.total_amount}</Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}

            {selectedOrder && selectedOrder.status === 'ready' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.acceptBtn, acceptLoading && styles.disabledBtn]} 
                  onPress={handleAcceptOrder}
                  disabled={acceptLoading}
                >
                  {acceptLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Package color="#fff" size={20} style={{ marginRight: 8 }} />
                      <Text style={styles.acceptBtnText}>Accept Order</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* DATE PICKER MODAL */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <XCircle color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerBody}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={tempStartDate}
                onChangeText={setTempStartDate}
                placeholder="2024-01-01"
              />

              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={tempEndDate}
                onChangeText={setTempEndDate}
                placeholder="2024-01-01"
              />

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleCustomDateApply}
              >
                <Text style={styles.applyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: { color: '#1e293b', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingBottom: 16,
    paddingLeft: 24,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  statusChipText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  statusChipTextActive: { color: '#3b82f6' },
  list: { padding: 20, paddingBottom: 40 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderType: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  orderId: { color: '#1e293b', fontSize: 16, fontWeight: '700' },
  orderStore: { color: '#64748b', fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#94a3b8', fontSize: 13, marginLeft: 6, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { color: '#1e293b', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 15, marginTop: 8 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '800' },
  modalLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusPoint: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusBannerText: { fontSize: 13, fontWeight: '800', flex: 1 },
  orderNumberText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
  },
  infoLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoVal: { color: '#475569', fontSize: 14, marginLeft: 12, fontWeight: '500', flex: 1 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: { color: '#1e293b', fontSize: 15, fontWeight: '600' },
  itemQty: { color: '#64748b', fontSize: 13, marginTop: 2 },
  itemPrice: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { color: '#64748b', fontSize: 14 },
  billVal: { color: '#1e293b', fontSize: 14, fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { color: '#1e293b', fontSize: 16, fontWeight: '800' },
  totalVal: { color: '#3b82f6', fontSize: 20, fontWeight: '800' },

  pickerBody: { paddingBottom: 20 },
  inputLabel: { color: '#64748b', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  dateInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  applyBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  acceptBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  actionIconBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginLeft: 8,
  },
});

export default OrdersScreen;
