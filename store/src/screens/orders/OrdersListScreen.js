import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { storeApi } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import Toast from 'react-native-toast-message';
import { alertService } from '../../utils/alertService';

import OrderCard from '../../components/orders/OrderCard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setGlobalFilter } from '../../store/slices/appSlice';
import { getDateRangeParams } from '../../utils/dateUtils';

export default function OrdersListScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const { globalFilter } = useAppSelector(state => state.app);
  const { dateRange, customRange } = globalFilter;

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async (page = 1, pageSize = pagination.pageSize, query = searchQuery) => {
    setLoading(true);
    try {
      const dateParams = getDateRangeParams(dateRange, {
        start: new Date(customRange.start),
        end: new Date(customRange.end)
      });

      const params = {
        ...dateParams,
        page,
        pageSize,
        search: query.trim() || undefined
      };

      const response = await storeApi.getOrders(params);
      if (response.data?.success) {
        setOrders(response.data.data.orders);
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        }
      }
    } catch (error) {
      console.error('[Orders] Fetch error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch orders' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { activeStoreId } = useAppSelector(state => state.auth);

  useEffect(() => {
    fetchOrders(1);
  }, [dateRange, customRange, activeTab, activeStoreId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1);
  };

  const handlePageSizeChange = (newSize) => {
    fetchOrders(1, newSize);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  const handleSearchSubmit = () => {
    fetchOrders(1);
  };

  const handleUpdateStatus = (order) => {
    const currentStatus = order.status;
    const buttons = [{ text: 'Cancel', style: 'cancel' }];

    if (currentStatus === 'placed') {
      buttons.push({ text: 'Confirm Order', onPress: () => updateStatus(order.id, 'confirmed') });
    } else if (currentStatus === 'confirmed') {
      buttons.push({ text: 'Start Packing', onPress: () => updateStatus(order.id, 'preparing') });
    } else if (currentStatus === 'preparing') {
      buttons.push({ text: 'Mark as Ready', onPress: () => updateStatus(order.id, 'ready') });
    }

    // Always allow cancellation if not ready/delivered
    if (['placed', 'confirmed', 'preparing'].includes(currentStatus)) {
      buttons.push({ text: 'Cancel Order', onPress: () => updateStatus(order.id, 'cancelled'), style: 'destructive' });
    }

    if (buttons.length <= 1) {
      Toast.show({ type: 'info', text1: 'No actions available', text2: `Order is currently ${currentStatus}` });
      return;
    }

    alertService.show({
      title: 'Update Status',
      message: `Current Status: ${currentStatus.toUpperCase()}\nSelect next action:`,
      type: 'info',
      buttons
    });
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await storeApi.updateOrderStatus(orderId, newStatus);
      Toast.show({ type: 'success', text1: 'Status updated' });
      fetchOrders(pagination.page);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab !== 'all') {
      return o.status === activeTab;
    }
    return true;
  });

  const renderItem = ({ item, index }) => {
    const snoIndex = (pagination.page - 1) * pagination.pageSize + index;
    return (
      <OrderCard
        item={item}
        index={snoIndex}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
        onUpdateStatus={() => handleUpdateStatus(item)}
      />
    );
  };

  const ListFooter = () => (
    <View style={styles.paginationFooter}>
      <Text style={styles.paginationInfo}>
        Showing {(pagination.page - 1) * pagination.pageSize + 1}–
        {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} records
      </Text>

      <View style={styles.paginationControls}>
        <View style={styles.pageSizeContainer}>
          {[50, 100, 200, 500].map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.pageSizeBtn, pagination.pageSize === size && styles.pageSizeBtnActive]}
              onPress={() => handlePageSizeChange(size)}
            >
              <Text style={[styles.pageSizeText, pagination.pageSize === size && styles.pageSizeTextActive]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pageButtons}>
          <TouchableOpacity
            disabled={pagination.page === 1}
            onPress={() => handlePageChange(pagination.page - 1)}
            style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
          >
            <Icon name="chevron-left" size={24} color={pagination.page === 1 ? COLORS.gray : COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.pageNumber}>Page {pagination.page} of {pagination.totalPages || 1}</Text>

          <TouchableOpacity
            disabled={pagination.page === pagination.totalPages}
            onPress={() => handlePageChange(pagination.page + 1)}
            style={[styles.pageBtn, pagination.page === pagination.totalPages && styles.pageBtnDisabled]}
          >
            <Icon name="chevron-right" size={24} color={pagination.page === pagination.totalPages ? COLORS.gray : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Orders List</Text>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ID, Status..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
            />
          </View>

          <DateRangeFilter
            activeRange={dateRange}
            onRangeChange={(r) => dispatch(setGlobalFilter({ dateRange: r }))}
            customRange={{
              start: new Date(customRange.start),
              end: new Date(customRange.end)
            }}
            onCustomRangeChange={(r) => dispatch(setGlobalFilter({ customRange: { start: r.start.toISOString(), end: r.end.toISOString() } }))}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabsContainer}>
            {['all', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListFooterComponent={orders.length > 0 ? <ListFooter /> : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package-variant" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: SPACING.m },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  toolbar: { gap: SPACING.m, marginBottom: SPACING.m },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, height: 44, flex: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.dark },
  tabsScroll: { maxHeight: 50 },
  tabsContainer: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9' },
  tabButtonActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray },
  tabTextActive: { color: COLORS.white },
  listContainer: { padding: SPACING.m, paddingBottom: 40 },
  paginationFooter: { padding: SPACING.m, backgroundColor: COLORS.white, borderRadius: RADIUS.card, marginTop: SPACING.m, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  paginationInfo: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginBottom: SPACING.m },
  paginationControls: { gap: SPACING.m },
  pageSizeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pageSizeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  pageSizeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pageSizeText: { fontSize: 12, color: COLORS.gray },
  pageSizeTextActive: { color: COLORS.white, fontWeight: 'bold' },
  pageButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  pageBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { opacity: 0.5 },
  pageNumber: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 16, color: COLORS.gray, fontSize: 14, textAlign: 'center' }
});
