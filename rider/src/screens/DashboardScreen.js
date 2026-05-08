import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  Vibration,
  StatusBar,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Power, User, ShoppingBag, TrendingUp, MapPinned, ChevronRight, Clock, Bell, Package, Route } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { setOnline, setLoading, setError, setProfile } from '../store/riderSlice';
import locationService from '../services/locationService';
import notificationService from '../services/notificationService';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import api from '../services/api';
import { Config } from 'react-native-config';

const API_URL = Config.API_URL || 'http://localhost:5000/api';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isOnline, user: profile, loading } = useSelector((state) => state.rider);
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [stats, setStats] = useState({ orders: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [startReading, setStartReading] = useState('');
  const [endReading, setEndReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayLog, setTodayLog] = useState(null);

  // 1. Initial Setup
  useEffect(() => {
    const init = async () => {
      console.log('📱 [Dashboard] Initializing components and listeners...');
      try {
        // Check Permissions
        if (Platform.OS === 'android') {
          if (PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION) {
            await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          }
          if (Platform.Version >= 33 && PERMISSIONS.ANDROID.POST_NOTIFICATIONS) {
            await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          }
        } else {
          if (PERMISSIONS.IOS.LOCATION_WHEN_IN_USE) {
            await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
          }
        }

        // Setup Notifications
        await notificationService.requestUserPermission();
        await notificationService.setupListeners();
      } catch (err) {
        console.error('[Dashboard] Init Error:', err);
      }
    };
    init();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, profileRes, activeRes, availableRes] = await Promise.all([
        api.get('/rider/dashboard'),
        api.get('/rider/profile'),
        api.get('/rider/orders/active'),
        api.get('/rider/orders/available')
      ]);

      if (dashRes.data.success && profileRes.data.success) {
        const dashboardData = dashRes.data.data;
        const riderProfile = profileRes.data.data.rider;

        setStats({
          orders: dashboardData.today_orders || 0
        });
        setRecentActivity(dashboardData.recent_activity || []);
        
        if (availableRes.data.success) {
          setAvailableOrders(availableRes.data.data.orders || []);
        }

        // Check for Active Orders
        if (activeRes.data.success && activeRes.data.data.orders?.length > 0) {
          setActiveOrder(activeRes.data.data.orders[0]);
        } else {
          setActiveOrder(null);
        }

        // Merge extra rider info (vehicle etc) into profile
        dispatch(setProfile({ ...profile, ...riderProfile }));
      }
    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
    }
  }, [dispatch]);

  const fetchDistanceLogs = useCallback(async () => {
    try {
      const res = await api.get('/rider/distance-logs');
      if (res.data.success && res.data.data.logs.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const log = res.data.data.logs.find(l => l.log_date === today);
        setTodayLog(log);
      }
    } catch (err) {
      console.error('Fetch Distance Error:', err);
    }
  }, []);

  // 2. Refresh data on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchDistanceLogs();
    }, [fetchDashboardData, fetchDistanceLogs])
  );

  // 2. Control Background Service based on status

  const handleToggle = async () => {
    dispatch(setLoading(true));
    try {
      const nextStatus = !isOnline;
      console.log(`🔌 [Status Toggle] Switching to: ${nextStatus ? 'ONLINE' : 'OFFLINE'}`);
      await api.patch('/rider/status', { is_online: nextStatus });
      dispatch(setOnline(nextStatus));
    } catch (err) {
      Alert.alert('Status Error', 'Failed to update your online status. Please check your internet.');
      console.error('Toggle Error:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };



  const handleLogDistance = async () => {
    if (!startReading || !endReading || isNaN(startReading) || isNaN(endReading)) {
      Alert.alert('Invalid Input', 'Please enter valid numeric readings.');
      return;
    }

    if (Number(endReading) < Number(startReading)) {
      Alert.alert('Invalid Input', 'End reading cannot be less than start reading.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/rider/distance-logs', { 
        start_reading: startReading,
        end_reading: endReading
      });
      if (res.data.success) {
        setTodayLog(res.data.data.log);
        setShowDistanceModal(false);
        setStartReading('');
        setEndReading('');
        Alert.alert('Success', 'Daily distance logged successfully!');
      }
    } catch (err) {
      console.error('Log Distance Error:', err);
      Alert.alert('Error', 'Failed to log distance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.riderName}>{profile?.full_name || 'Rider'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#1e293b" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <User color="#1e293b" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ONLINE STATUS TOGGLE */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusIndicator, isOnline ? styles.bgOnline : styles.bgOffline]} />
              <View>
                <Text style={styles.statusTitle}>{isOnline ? 'Active & Searching' : 'Currently Offline'}</Text>
                <Text style={styles.statusSub}>{isOnline ? 'Waiting for new orders nearby' : 'Go online to receive delivery requests'}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleToggle}
              disabled={loading}
              style={[styles.toggleBtn, isOnline ? styles.toggleBtnOn : styles.toggleBtnOff]}
            >
              <View style={[styles.toggleDot, isOnline ? styles.toggleDotOn : styles.toggleDotOff]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVE DELIVERY RESUME */}
        {activeOrder && (
          <View style={styles.activeSection}>
            <Text style={styles.sectionLabel}>Ongoing Delivery</Text>
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() => navigation.navigate('ActiveDelivery', { order: activeOrder })}
              activeOpacity={0.8}
            >
              <View style={styles.activeIcon}>
                <Clock color="#fff" size={20} />
              </View>
              <View style={styles.activeInfo}>
                <Text style={styles.activeTitle}>Resume Order #{activeOrder.order_number}</Text>
                <Text style={styles.activeSub}>{activeOrder.store?.name || 'Store'} • {activeOrder.status.replace(/_/g, ' ')}</Text>
              </View>
              <ChevronRight color="#94a3b8" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {/* AVAILABLE ORDERS SECTION */}
        <View style={styles.availableSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Pending for Pickup</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders', { status: 'ready' })}>
              <Text style={styles.viewAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {availableOrders.length > 0 ? (
            availableOrders.map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.availableCard}
                onPress={() => navigation.navigate('Orders', { selectedOrderId: item.original_id })}
              >
                <View style={styles.availableIcon}>
                  <Package color="#3b82f6" size={18} />
                </View>
                <View style={styles.availableInfo}>
                  <Text style={styles.availableTitle}>Order #{item.id}</Text>
                  <Text style={styles.availableSub}>{item.store} • {item.store_address}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: item.delivery_type === 'express' ? '#ef4444' : '#22c55e' }}>
                      {item.delivery_type === 'express' ? '⚡ EXPRESS' : '📅 SCHEDULED'}
                    </Text>
                    {item.delivery_slot_label && (
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748b' }}>
                        • {item.delivery_slot_label}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>AVAILABLE</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAvailable}>
              <Text style={styles.emptyAvailableText}>No pending orders in your area</Text>
            </View>
          )}
        </View>

        <View style={styles.availableSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Daily Tracking</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DistanceHistory')}>
              <Text style={styles.viewAllText}>History</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.distanceCard}
            onPress={() => setShowDistanceModal(true)}
          >
            <View style={styles.distanceIcon}>
              <Route color="#10b981" size={24} />
            </View>
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceTitle}>
                {todayLog ? `${todayLog.distance_km} KM Logged` : 'Log Daily Distance'}
              </Text>
              <Text style={styles.distanceSub}>
                {todayLog ? 'Click to update today\'s reading' : 'Enter your total KM for today'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.logBtn}
              onPress={() => setShowDistanceModal(true)}
            >
              <Text style={styles.logBtnText}>{todayLog ? 'UPDATE' : 'LOG'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* PERFORMANCE STATS */}
        <Text style={styles.sectionLabel}>Today's Performance</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statBoxFull}
            onPress={() => navigation.navigate('Orders', { status: 'delivered' })}
          >
            <View style={styles.statIconContainer}>
              <ShoppingBag color="#3b82f6" size={28} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statVal}>{stats.orders}</Text>
              <Text style={styles.statLabel}>Orders Completed Today</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* RECENT ACTIVITY */}
        <Text style={styles.sectionLabel}>Recent Activity</Text>
        {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.activityCard}
            onPress={() => {
              if (activity.id) {
                navigation.navigate('Orders', { selectedOrderId: activity.id });
              }
            }}
          >
            <View style={styles.activityIcon}>
              <ShoppingBag color="#3b82f6" size={20} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time} • {activity.location}</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>No activity recorded today</Text>
          </View>
        )}

      </ScrollView>



      {/* DISTANCE LOGGING MODAL */}
      <Modal
        visible={showDistanceModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.distanceModalContent}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.modalTitle}>Log Daily Distance</Text>
            <Text style={styles.modalSubtitle}>Enter odometer readings for today</Text>
            
            <Text style={styles.inputLabel}>Starting Reading</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.distanceInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={startReading}
                onChangeText={setStartReading}
              />
              <Text style={styles.unitText}>KM</Text>
            </View>

            <Text style={styles.inputLabel}>Ending Reading</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.distanceInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={endReading}
                onChangeText={setEndReading}
              />
              <Text style={styles.unitText}>KM</Text>
            </View>

            {startReading && endReading && !isNaN(startReading) && !isNaN(endReading) && (
              <View style={styles.calcBox}>
                <Text style={styles.calcLabel}>Calculated Distance:</Text>
                <Text style={styles.calcValue}>{(Number(endReading) - Number(startReading)).toFixed(2)} KM</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowDistanceModal(false);
                  setStartReading('');
                  setEndReading('');
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogDistance}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Save Log</Text>
                )}
              </TouchableOpacity>
            </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
    </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  greeting: { color: '#64748b', fontSize: 14 },
  riderName: { color: '#1e293b', fontSize: 20, fontWeight: 'bold' },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 24, paddingBottom: 40 },
  statusSection: { marginBottom: 24 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  bgOnline: { backgroundColor: '#10b981' },
  bgOffline: { backgroundColor: '#94a3b8' },
  statusTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
  statusSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  toggleBtn: {
    width: 54,
    height: 30,
    borderRadius: 15,
    padding: 4,
    justifyContent: 'center',
  },
  toggleBtnOn: { backgroundColor: '#10b981' },
  toggleBtnOff: { backgroundColor: '#e2e8f0' },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleDotOn: { alignSelf: 'flex-end' },
  toggleDotOff: { alignSelf: 'flex-start' },

  sectionLabel: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  statsGrid: { marginBottom: 32 },
  statBoxFull: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: { flex: 1 },
  statVal: { color: '#1e293b', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 14, marginTop: 2 },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityInfo: { flex: 1 },
  activityTitle: { color: '#1e293b', fontSize: 15, fontWeight: '500' },
  activityTime: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  emptyActivity: { padding: 40, alignItems: 'center' },
  emptyActivityText: { color: '#94a3b8', fontSize: 14 },



  // ACTIVE DELIVERY STYLES
  activeSection: { marginTop: 24, paddingHorizontal: 0 },
  activeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  activeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activeInfo: { flex: 1 },
  activeTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  activeSub: { color: '#64748b', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  distanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  distanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  distanceInfo: {
    flex: 1,
  },
  distanceTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  distanceSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  distanceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    width: width * 0.85,
    maxHeight: height * 0.8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  distanceInput: {
    flex: 1,
    height: 54,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  calcBox: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  calcLabel: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
  },
  calcValue: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    height: 54,
    backgroundColor: '#10b981',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableSection: { marginBottom: 32 },
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  availableIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  availableInfo: { flex: 1 },
  availableTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  availableSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  availableBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  availableBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyAvailable: {
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  emptyAvailableText: { color: '#94a3b8', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;