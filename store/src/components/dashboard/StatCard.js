import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../../theme/theme';

const StatCard = ({ title, value, icon, color, onPress, isCurrency = false }) => (
  <TouchableOpacity 
    style={styles.card} 
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={28} color={color} />
    </View>
    <Text style={styles.statValue}>
      {isCurrency 
        ? `₹${Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` 
        : value}
    </Text>
    <Text style={styles.statLabel}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: COLORS.white,
    padding: SPACING.l,
    borderRadius: RADIUS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: SPACING.s,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default StatCard;
