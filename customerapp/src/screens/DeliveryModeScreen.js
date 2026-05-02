import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { setDeliveryMode } from '../store/slices/configSlice';

const DeliveryModeScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const handleSelectMode = (mode) => {
    dispatch(setDeliveryMode(mode));
    navigation.replace('AppTabs');
  };

  const scheduledSlots = [
    { id: 'today_evening', title: 'Today Evening', time: '5 PM - 9 PM', icon: 'weather-night', color: '#4F46E5' },
    { id: 'tmrw_morning', title: 'Tomorrow Morning', time: '7 AM - 11 AM', icon: 'weather-sunset-up', color: '#10B981' },
    { id: 'tmrw_evening', title: 'Tomorrow Evening', time: '5 PM - 9 PM', icon: 'weather-night', color: '#6366F1' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Delivery Options</Text>
          <Text style={styles.subtitle}>Select how you'd like to receive your fresh products.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Instant Delivery</Text>
          <TouchableOpacity 
            style={[styles.modeCard, styles.expressCard]}
            onPress={() => handleSelectMode('express')}
            activeOpacity={0.9}
          >
            <View style={styles.iconContainer}>
              <Icon name="lightning-bolt" size={32} color="#F59E0B" />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.modeHeader}>
                <Text style={styles.modeTitle}>Express Delivery</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>90 MINS</Text>
                </View>
              </View>
              <Text style={styles.modeDescription}>
                Fresh meat & fish delivered in 90 minutes.
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Scheduled Delivery</Text>
          <View style={styles.slotsContainer}>
            {scheduledSlots.map((slot) => (
              <TouchableOpacity 
                key={slot.id}
                style={styles.slotCard}
                onPress={() => handleSelectMode(slot.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.slotIcon, { backgroundColor: slot.color + '15' }]}>
                  <Icon name={slot.icon} size={24} color={slot.color} />
                </View>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTitle}>{slot.title}</Text>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                </View>
                <Icon name="calendar-check" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            * Inventory and prices may vary based on your selection.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.l,
  },
  logo: {
    width: 100,
    height: 60,
    marginBottom: SPACING.s,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SPACING.l,
  },
  section: {
    paddingHorizontal: SPACING.l,
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.m,
    marginLeft: 4,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  tag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  modeDescription: {
    fontSize: 13,
    color: COLORS.gray,
  },
  slotsContainer: {
    gap: 12,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  slotInfo: {
    flex: 1,
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  slotTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default DeliveryModeScreen;
