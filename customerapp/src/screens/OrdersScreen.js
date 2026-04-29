import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import orderService from '../api/orderService';
import LogoLoader from '../components/LogoLoader';
import { format, parseISO } from 'date-fns';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilters, setDateFilters] = useState({ startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('startDate');

  const fetchOrders = async (filters = dateFilters) => {
    setLoading(true);
    const res = await orderService.getMyOrders(filters);
    if (res.success) {
      setOrders(res.data.orders);
    }
    setLoading(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      // Use local date format YYYY-MM-DD instead of UTC-based ISO string
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      setDateFilters(prev => ({
        ...prev,
        [pickerTarget]: dateStr
      }));
    }
  };

  const openPicker = (target) => {
    setPickerTarget(target);
    setShowPicker(true);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (!status) return COLORS.gray;
    switch (status.toLowerCase()) {
      case 'delivered': return '#4CAF50';
      case 'ready': return '#2196F3'; // Blue for ready
      case 'preparing': return '#FF9800'; // Orange for preparing
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'confirmed': return '#2196F3';
      case 'shipped': return '#9C27B0';
      default: return COLORS.gray;
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { order: item })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.storeInfo}>
          <View style={styles.storeIconContainer}>
            <Icon name="storefront-outline" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.storeName}>{item.store?.name || 'Daily Fresh'}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })} • {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {(item.status || 'UNKNOWN').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.orderBody}>
        <View style={styles.itemsPreview}>
          <Text style={styles.itemText} numberOfLines={1}>
            {item.items?.map(it => it.variant?.name || it.name).join(', ')}
          </Text>
          <Text style={styles.itemCount}>
            {item.items?.length || 0} {item.items?.length === 1 ? 'Item' : 'Items'}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Paid</Text>
          <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID:</Text>
          <Text style={styles.orderIdValue}>#{item.order_number?.slice(-8).toUpperCase() || 'N/A'}</Text>
        </View>
        <View style={styles.viewDetailBtn}>
          <Text style={styles.viewDetailText}>View Details</Text>
          <Icon name="chevron-right" size={16} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
          <Icon name="calendar-range" size={22} color={showFilters ? COLORS.primary : COLORS.dark} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>From Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => openPicker('startDate')}>
                <Text style={styles.dateValue}>{formatDateReadable(dateFilters.startDate) || 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>To Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => openPicker('endDate')}>
                <Text style={styles.dateValue}>{formatDateReadable(dateFilters.endDate) || 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={[styles.filterActionBtn, { backgroundColor: '#F3F4F6' }]} 
              onPress={() => {
                const clear = { startDate: '', endDate: '' };
                setDateFilters(clear);
                fetchOrders(clear);
                setShowFilters(false);
              }}
            >
              <Text style={{ color: COLORS.dark }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterActionBtn, { backgroundColor: COLORS.primary }]} 
              onPress={() => {
                // Pass current state explicitly to bypass async state update lag
                fetchOrders(dateFilters);
                setShowFilters(false);
              }}
            >
              <Text style={{ color: COLORS.white }}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>* Select dates to filter your order history.</Text>
        </View>
      )}

      {(dateFilters.startDate || dateFilters.endDate) && !showFilters && (
        <View style={styles.activeFilterBar}>
          <Icon name="filter-variant" size={16} color={COLORS.primary} />
          <Text style={styles.activeFilterText}>
            Showing orders from {formatDateReadable(dateFilters.startDate) || 'Any'} to {formatDateReadable(dateFilters.endDate) || 'Any'}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              const clear = { startDate: '', endDate: '' };
              setDateFilters(clear);
              fetchOrders(clear);
            }}
            style={styles.clearMiniBtn}
          >
            <Icon name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={dateFilters[pickerTarget] ? new Date(dateFilters[pickerTarget]) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {loading ? (
        <LogoLoader fullScreen />
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="shopping-outline" size={80} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>When you place an order, it will appear here.</Text>
          <TouchableOpacity 
            style={styles.shopBtn}
            onPress={() => navigation.navigate('AppTabs', { screen: 'Home' })}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: SPACING.s,
  },
  filterBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  filterSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateSelector: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  dateValue: {
    fontSize: 13,
    color: COLORS.dark,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  filterActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  helperText: {
    fontSize: 10,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: SPACING.m,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  activeFilterText: {
    flex: 1,
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '500',
  },
  clearMiniBtn: {
    padding: 2,
  },
  listContainer: {
    padding: SPACING.m,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  orderDate: {
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: SPACING.m,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsPreview: {
    flex: 1,
    marginRight: SPACING.l,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderIdLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  orderIdValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dark,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.l,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
    marginBottom: SPACING.xl,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.m,
  },
  shopBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OrdersScreen;
