import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';

const OrderCard = ({ item, index, onPress, onUpdateStatus }) => {
  const isDelivered = item.status === 'delivered';
  const dateStr = new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.snoBadge}>
            <Text style={styles.snoText}>{index + 1}</Text>
          </View>
          <View>
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isDelivered ? COLORS.success + '20' : COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: isDelivered ? COLORS.success : COLORS.warning }]}>
            {item.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Icon name="package-variant-closed" size={16} color={COLORS.gray} />
          <Text style={styles.infoText}>{item.items?.length || 0} Items</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="map-marker-outline" size={16} color={COLORS.gray} />
          <Text style={styles.infoText} numberOfLines={2}>{item.delivery_address || 'No address provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="currency-inr" size={16} color={COLORS.gray} />
          <Text style={[styles.infoText, { fontWeight: 'bold', color: COLORS.dark }]}>{item.total_amount}</Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>{item.payment_status?.toUpperCase() || 'PENDING'}</Text>
          </View>
        </View>
      </View>

      {!isDelivered && (
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onUpdateStatus(item)}
        >
          <Icon name="truck-delivery-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Update Status</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, padding: SPACING.l, borderRadius: RADIUS.card, marginBottom: SPACING.m, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.m },
  snoBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  snoText: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray },
  orderId: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  orderDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  cardInfo: { marginBottom: SPACING.m, gap: SPACING.s },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: COLORS.gray, flex: 1 },
  paymentBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  paymentText: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray },
  actionBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
});

export default OrderCard;
