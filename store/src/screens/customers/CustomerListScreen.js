import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { storeApi } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';
import Toast from 'react-native-toast-message';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setGlobalFilter } from '../../store/slices/appSlice';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import { getDateRangeParams } from '../../utils/dateUtils';

export default function CustomerListScreen() {
  const dispatch = useAppDispatch();
  const { globalFilter } = useAppSelector(state => state.app);
  const { dateRange, customRange } = globalFilter;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      const params = getDateRangeParams(dateRange, {
        start: new Date(customRange.start),
        end: new Date(customRange.end)
      });
      const response = await storeApi.getCustomers(params);
      if (response.data?.success) {
        setCustomers(response.data.data.customers);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch customers' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarText}>{item.full_name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.full_name}</Text>
          <Text style={styles.customerContact}>{item.phone} | {item.email}</Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{item.total_spent.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{new Date(item.last_order_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
          <Text style={styles.statLabel}>Last Order</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginTop: SPACING.m }}>
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
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-group-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>No customers found for this store.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.l, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginBottom: SPACING.m },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: RADIUS.button, paddingHorizontal: SPACING.m, height: 45 },
  searchIcon: { marginRight: SPACING.s },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: COLORS.dark },
  listContainer: { padding: SPACING.m },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.card, padding: SPACING.l, marginBottom: SPACING.m, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
  avatarContainer: { marginRight: SPACING.m },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholderAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  customerContact: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.m, borderTopWidth: 1, borderTopColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 2, textTransform: 'uppercase' },
  divider: { width: 1, height: 20, backgroundColor: COLORS.border },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: SPACING.m, fontSize: 16 }
});
