import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Vibration,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { ShoppingBag, MapPin, Package, Clock, X, CheckCircle2, Hash } from 'lucide-react-native';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const NewOrderScreen = ({ route, navigation }) => {
  const { order } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout

  useEffect(() => {
    // Start continuous vibration for the new order
    const vibrationInterval = setInterval(() => {
      Vibration.vibrate([0, 500, 200, 500]);
    }, 1200);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigation.goBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(vibrationInterval);
      clearInterval(timer);
      Vibration.cancel();
    };
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.post('/rider/orders/accept', { orderId: order.order_id });
      if (res.data.success) {
        navigation.replace('ActiveDelivery', { order: res.data.data.order });
      }
    } catch (err) {
      console.error('Accept Error:', err);
      alert('Order no longer available.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    navigation.goBack();
  };

  if (!order) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDecline} style={styles.closeBtn}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <View style={styles.timerBadge}>
            <Clock color="#fbbf24" size={14} />
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <ShoppingBag color="#3b82f6" size={40} />
          </View>
          
          <Text style={styles.typeLabel}>NEW DELIVERY REQUEST</Text>
          <Text style={styles.storeName}>{order.store_name}</Text>
          
          <View style={styles.infoRow}>
            <MapPin color="#94a3b8" size={18} />
            <Text style={styles.infoText}>{order.store_address || 'Nearby Store'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsBox}>
            <View style={styles.detailItem}>
              <Hash color="#64748b" size={16} />
              <Text style={styles.detailText}>Order #{order.order_number}</Text>
            </View>
            <View style={styles.detailItem}>
              <Package color="#64748b" size={16} />
              <Text style={styles.detailText} numberOfLines={2}>
                {order.items_summary || 'Fresh Items'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.declineBtn} 
            onPress={handleDecline}
            disabled={loading}
          >
            <Text style={styles.declineText}>Ignore</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptBtn} 
            onPress={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle2 color="#fff" size={24} />
                <Text style={styles.acceptText}>Accept Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Deep navy/dark background
  },
  safeArea: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  timerText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  typeLabel: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  storeName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    color: '#cbd5e1',
    fontSize: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
  },
  declineBtn: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  acceptText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewOrderScreen;
