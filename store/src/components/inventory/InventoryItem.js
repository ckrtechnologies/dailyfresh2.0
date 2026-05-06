import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';

const InventoryItem = ({ item, onToggleActive, onEdit, onDelete }) => {

  return (
    <View style={[styles.card, !item.is_active && styles.cardInactive]}>
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <Icon name="image-off" size={24} color={COLORS.gray} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.categoryRow}>
           <Text style={styles.categoryLabel}>{item.sub_category?.category?.name} / {item.sub_category?.name}</Text>
        </View>
        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        <View style={styles.priceStockRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <View style={styles.stockColumn}>
            <View style={[styles.stockBadge, item.express_stock_qty < 10 && styles.lowStockBadge]}>
              <Text style={[styles.productStock, item.express_stock_qty < 10 && styles.lowStockText]}>
                EX: {item.express_stock_qty || 0}
              </Text>
            </View>
            <View style={[styles.stockBadge, item.scheduled_stock_qty < 10 && styles.lowStockBadge]}>
              <Text style={[styles.productStock, item.scheduled_stock_qty < 10 && styles.lowStockText]}>
                SCH: {item.scheduled_stock_qty || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.actionsColumn}>
        <Switch 
          value={item.is_active} 
          onValueChange={() => onToggleActive(item.id, item.is_active)}
          trackColor={{ false: COLORS.border, true: COLORS.success }}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginBottom: 8 }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={styles.actionIconBtn}
            onPress={() => onEdit(item)}
          >
            <Icon name="pencil" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionIconBtn, { backgroundColor: COLORS.error + '20' }]}
            onPress={() => onDelete(item.id)}
          >
            <Icon name="delete" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: RADIUS.card, 
    marginBottom: SPACING.m, 
    flexDirection: 'row', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  cardInactive: { opacity: 0.6 },
  imageContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: RADIUS.button, 
    backgroundColor: COLORS.lightGray, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.m, 
    overflow: 'hidden' 
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  categoryRow: { marginBottom: 4 },
  categoryLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '600', backgroundColor: COLORS.primary + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  productSku: { fontSize: 12, color: COLORS.gray, marginBottom: 6 },
  priceStockRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  productPrice: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  stockBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.badge },
  stockColumn: { gap: 4 },
  lowStockBadge: { backgroundColor: COLORS.error + '10' },
  lowStockText: { color: COLORS.error, fontWeight: 'bold' },
  productStock: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  actionsColumn: { alignItems: 'flex-end', marginLeft: SPACING.s },
  actionIconBtn: { backgroundColor: COLORS.lightGray, padding: 8, borderRadius: 20 },
});

export default InventoryItem;
