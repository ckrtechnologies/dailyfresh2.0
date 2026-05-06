import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { storeApi } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '../../store/hooks';
import { setDashboardStats, setGlobalFilter } from '../../store/slices/appSlice';
import { useAppSelector } from '../../store/hooks';

import StatCard from '../../components/dashboard/StatCard';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { getDateRangeParams } from '../../utils/dateUtils';

export default function DashboardScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const { globalFilter } = useAppSelector(state => state.app);
  const { dateRange, customRange } = globalFilter;

  const [revenue, setRevenue] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboard = async () => {
    // Show loading state and reset metrics to show they are being refreshed
    setLoading(true);
    setRevenue(0);
    setActiveOrdersCount(0);
    setTotalProducts(0);
    setLowStockCount(0);
    setLatestOrders([]);

    try {
      const params = {
        ...getDateRangeParams(dateRange, {
          start: new Date(customRange.start),
          end: new Date(customRange.end)
        }),
        _t: Date.now() // Cache busting
      };

      const response = await storeApi.getDashboard(params);

      if (response.data?.success) {
        const data = response.data.data;
        // Update individual state variables
        setRevenue(data.total_revenue || 0);
        setActiveOrdersCount(data.active_orders || 0);
        setTotalProducts(data.total_products || 0);
        setLowStockCount(data.low_stock_alerts || 0);
        setLatestOrders(data.latest_orders || []);
        setLastUpdated(new Date());

        // Also update global store
        dispatch(setDashboardStats(data));
      }
    } catch (error) {
      console.error('[Dashboard] Fetch error:', error);
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: error.response?.data?.message || 'Check your connection',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateRange, customRange]);

  const handleRangeChange = (range) => {
    dispatch(setGlobalFilter({ dateRange: range }));
  };

  const handleCustomRangeChange = (range) => {
    dispatch(setGlobalFilter({
      customRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      }
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Overview of your store performance</Text>
            </View>
            <Text style={{ fontSize: 10, color: COLORS.gray, marginTop: 5 }}>
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <DateRangeFilter
            activeRange={dateRange}
            onRangeChange={handleRangeChange}
            customRange={{
              start: new Date(customRange.start),
              end: new Date(customRange.end)
            }}
            onCustomRangeChange={handleCustomRangeChange}
          />
        </View>

        <View style={styles.grid}>
          <StatCard
            title="Total Revenue"
            value={revenue}
            icon="currency-inr"
            color={COLORS.primary}
            onPress={() => navigation.navigate('Orders', { screen: 'OrdersList' })}
            isCurrency
          />
          <StatCard
            title="Active Orders"
            value={activeOrdersCount}
            icon="truck-delivery"
            color="#3b82f6"
            onPress={() => navigation.navigate('Orders', { screen: 'OrdersList' })}
          />
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon="package-variant-closed"
            color="#8b5cf6"
            onPress={() => navigation.navigate('Inventory')}
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount}
            icon="alert-circle-outline"
            color={COLORS.error}
            onPress={() => navigation.navigate('Inventory')}
          />
        </View>

        {/* Latest Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders', { screen: 'OrdersList' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {latestOrders.length > 0 ? (
            latestOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderItem}
                onPress={() => navigation.navigate('Orders', { screen: 'OrderDetails', params: { order } })}
              >
                <View style={styles.orderIconBox}>
                  <Icon name="shopping-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderCustomer}>{order.customer?.full_name || 'Guest'}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>₹{order.total_amount}</Text>
                  <View style={[styles.miniStatus, { backgroundColor: order.status === 'delivered' ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                    <Text style={[styles.miniStatusText, { color: order.status === 'delivered' ? COLORS.success : COLORS.warning }]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent orders</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.m },
  header: { marginBottom: SPACING.l, paddingHorizontal: SPACING.s },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.gray,
    marginTop: SPACING.m,
    fontSize: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginTop: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  orderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  orderCustomer: {
    fontSize: 12,
    color: COLORS.gray,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  miniStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontStyle: 'italic',
    paddingVertical: SPACING.m,
  }
});
