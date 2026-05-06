import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle2,
  Circle,
  ExternalLink
} from 'lucide-react-native';

import api from '../services/api';

const ActiveDeliveryScreen = ({ route, navigation }) => {
  const { order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#1e293b', textAlign: 'center', marginTop: 100 }}>Order data not found</Text>
      </SafeAreaView>
    );
  }

  const handleNavigate = async () => {
    try {
      const storeLat = order.store?.latitude;
      const storeLng = order.store?.longitude;
      const customerLat = order.address?.latitude;
      const customerLng = order.address?.longitude;

      if (!storeLat || !storeLng || !customerLat || !customerLng) {
        Alert.alert('Missing Location', 'Coordinates for the store or customer are not available. Please contact support.');
        return;
      }

      // Google Maps multi-stop URL: origin -> waypoints -> destination
      // We leave origin empty to use current location
      const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}&waypoints=${storeLat},${storeLng}`;
      
      // On some devices, canOpenURL returns false for web links even if a browser/maps app exists
      // We attempt to open directly and catch the failure
      try {
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert('Navigation Error', 'Could not open map application. Please ensure Google Maps is installed.');
      }
    } catch (err) {
      console.error('[Navigation Error]', err);
      Alert.alert('Navigation Error', 'Could not launch map application.');
    }
  };

  const handleCall = async (phone) => {
    try {
      if (!phone) return;
      await Linking.openURL(`tel:${phone}`);
    } catch (err) {
      Alert.alert('Call Error', 'Could not initiate phone call.');
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      console.log(`🚚 [Delivery Update] Updating Order #${order.order_number} to ${newStatus}`);
      const res = await api.patch(`/rider/orders/${order.id}/status`, { status: newStatus });
      if (res.data.success) {
        setOrder(res.data.data.order);
        if (newStatus === 'delivered') {
          Alert.alert('Success', 'Order delivered successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
          ]);
        }
      }
    } catch (err) {
      console.error('Update Status Error:', err);
      Alert.alert('Update Failed', err.response?.data?.message || 'Could not update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    const currentStatus = order.status || 'accepted';

    if (currentStatus === 'accepted') {
      Alert.alert('Confirm Pickup', 'Have you picked up the order from the store?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Picked Up', onPress: () => updateStatus('picked_up') }
      ]);
    } else if (currentStatus === 'picked_up' || currentStatus === 'out_for_delivery') {
      Alert.alert('Confirm Delivery', 'Is the order handed over to the customer?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Delivered', onPress: () => updateStatus('delivered') }
      ]);
    }
  };

  const currentStatus = order.status || 'accepted';
  const isPickedUp = currentStatus === 'picked_up' || currentStatus === 'out_for_delivery' || currentStatus === 'delivered';
  const isDelivered = currentStatus === 'delivered';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1e293b" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.order_number || order.id}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* PROGRESS TRACKER */}
        <View style={styles.trackerRow}>
          <View style={styles.trackerStep}>
            <View style={[styles.stepDot, { backgroundColor: '#10b981' }]}>
              <CheckCircle2 color="#fff" size={14} />
            </View>
            <Text style={styles.stepTextActive}>Accepted</Text>
          </View>
          <View style={[styles.stepLine, isPickedUp && { backgroundColor: '#10b981' }]} />
          <View style={styles.trackerStep}>
            <View style={[styles.stepDot, isPickedUp ? { backgroundColor: '#10b981' } : { backgroundColor: '#e2e8f0' }]}>
              {isPickedUp ? <CheckCircle2 color="#fff" size={14} /> : <Circle color="#94a3b8" size={14} />}
            </View>
            <Text style={isPickedUp ? styles.stepTextActive : styles.stepText}>Picked Up</Text>
          </View>
          <View style={[styles.stepLine, isDelivered && { backgroundColor: '#10b981' }]} />
          <View style={styles.trackerStep}>
            <View style={[styles.stepDot, isDelivered ? { backgroundColor: '#10b981' } : { backgroundColor: '#e2e8f0' }]}>
              {isDelivered ? <CheckCircle2 color="#fff" size={14} /> : <Circle color="#94a3b8" size={14} />}
            </View>
            <Text style={isDelivered ? styles.stepTextActive : styles.stepText}>Delivered</Text>
          </View>
        </View>

        {/* CURRENT TASK CARD */}
        <View style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskLabelRow}>
              <View style={styles.taskIconBox}>
                {currentStatus === 'accepted' ? <Package color="#3b82f6" size={18} /> : <MapPin color="#3b82f6" size={18} />}
              </View>
              <Text style={styles.taskLabel}>{currentStatus === 'accepted' ? 'PICKUP FROM STORE' : 'DELIVER TO CUSTOMER'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.navBtn}
              onPress={handleNavigate}
            >
              <Navigation color="#fff" size={16} />
              <Text style={styles.navBtnText}>Navigate</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.locationName}>
            {currentStatus === 'accepted' ? (order.store?.name || 'Daily Fresh Hub') : (order.address?.full_name || 'Customer')}
          </Text>
          <Text style={styles.locationAddr}>
            {currentStatus === 'accepted' ? (order.store?.address || 'Store Address') : (order.address?.complete_address || 'Delivery Address')}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => handleCall(currentStatus === 'accepted' ? '1234567890' : order.address?.phone)}
            >
              <Phone color="#3b82f6" size={20} />
              <Text style={styles.contactBtnText}>Call {currentStatus === 'accepted' ? 'Store' : 'Customer'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ITEMS LIST */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Package color="#64748b" size={20} />
            <Text style={styles.itemsTitle}>Delivery Items</Text>
          </View>
          
          <View style={styles.itemBox}>
             <Text style={styles.itemText}>{order.items_summary || 'Fresh Items'}</Text>
          </View>
        </View>

      </ScrollView>

      {/* FOOTER ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.mainActionBtn, currentStatus === 'picked_up' ? styles.btnSuccess : styles.btnPrimary]}
          onPress={handleStatusUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainActionText}>
              {currentStatus === 'accepted' ? 'Confirm Pickup' : 'Mark as Delivered'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 24 },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  trackerStep: { alignItems: 'center', width: 70 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  stepText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  stepTextActive: { color: '#1e293b', fontSize: 10, fontWeight: 'bold' },
  stepLine: { height: 3, backgroundColor: '#e2e8f0', flex: 1, marginTop: -20, marginHorizontal: -10 },
  
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  taskLabelRow: { flex: 1 },
  taskIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#eff6ff', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 10
  },
  taskLabel: { color: '#3b82f6', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  navBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  locationName: { color: '#1e293b', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  locationAddr: { color: '#64748b', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  
  actionsRow: { gap: 12 },
  contactBtn: {
    flexDirection: 'row',
    backgroundColor: '#f1f7ff',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  contactBtnText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
  
  itemsSection: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  itemsTitle: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
  itemBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16 },
  itemText: { color: '#475569', fontSize: 15, lineHeight: 22 },
  
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mainActionBtn: {
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimary: { backgroundColor: '#3b82f6', shadowColor: '#3b82f6' },
  btnSuccess: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  mainActionText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ActiveDeliveryScreen;
