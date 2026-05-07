import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Route, Gauge, Filter, TrendingUp } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setDateRange } from '../store/dateRangeSlice';
import api from '../services/api';

const DistanceHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { startDate, endDate, label: dateLabel } = useSelector((state) => state.dateRange);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rider/distance-logs', {
        params: { startDate, endDate }
      });
      if (res.data.success) {
        setLogs(res.data.data.logs);
      }
    } catch (err) {
      console.error('Fetch Logs Error:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  const totalKM = logs.reduce((acc, log) => acc + Number(log.distance_km), 0).toFixed(2);

  const renderItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Calendar color="#64748b" size={14} />
          <Text style={styles.dateText}>
            {new Date(item.log_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance_km} KM</Text>
        </View>
      </View>

      <View style={styles.readingContainer}>
        <View style={styles.readingItem}>
          <Text style={styles.readingLabel}>Start Reading</Text>
          <View style={styles.readingValueRow}>
            <Gauge color="#10b981" size={16} />
            <Text style={styles.readingValue}>{item.start_reading}</Text>
          </View>
        </View>
        <View style={styles.readingDivider} />
        <View style={styles.readingItem}>
          <Text style={styles.readingLabel}>End Reading</Text>
          <View style={styles.readingValueRow}>
            <Gauge color="#f43f5e" size={16} />
            <Text style={styles.readingValue}>{item.end_reading}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>Travel History</Text>
            <Text style={styles.headerSub}>Tracking your daily distance</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter color="#3b82f6" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                onPress={() => {
                  const range = filter.getValue();
                  dispatch(setDateRange({ ...range, label: filter.label }));
                }}
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
      </View>

      <View style={styles.statsSummary}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <TrendingUp color="#3b82f6" size={24} />
          </View>
          <View>
            <Text style={styles.summaryVal}>{totalKM} KM</Text>
            <Text style={styles.summaryLabel}>Total Distance ({dateLabel})</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchLogs}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Route color="#cbd5e1" size={64} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No logs for this period</Text>
              <Text style={styles.emptySub}>Try selecting a different date range</Text>
            </View>
          }
        />
      )}
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
  statsSummary: {
    padding: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryVal: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  listContent: { padding: 24, paddingTop: 0 },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  dateText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  distanceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  distanceText: { fontSize: 15, color: '#10b981', fontWeight: 'bold' },
  readingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  readingItem: { flex: 1, alignItems: 'center' },
  readingLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
  readingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readingValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  readingDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyTitle: { color: '#1e293b', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
});

export default DistanceHistoryScreen;
