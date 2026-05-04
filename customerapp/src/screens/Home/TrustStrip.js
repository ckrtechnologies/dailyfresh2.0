import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SPACING } from '../../constants/theme';

const TrustStrip = React.memo(({ activeTheme }) => {
  return (
    <View style={styles.trustStrip}>
      <View style={styles.trustItem}>
        <Icon name="check-decagram" size={28} color={activeTheme.primary} />
        <Text style={[styles.trustText, { color: activeTheme.text }]}>100% Fresh</Text>
      </View>
      <View style={styles.trustItem}>
        <Icon name="shield-check" size={28} color={activeTheme.primary} />
        <Text style={[styles.trustText, { color: activeTheme.text }]}>Chemical-Free</Text>
      </View>
      <View style={styles.trustItem}>
        <Icon name="truck-delivery" size={28} color={activeTheme.primary} />
        <Text style={[styles.trustText, { color: activeTheme.text }]}>Fast Delivery</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  trustStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xl,
    backgroundColor: '#F9FAFB',
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default TrustStrip;
