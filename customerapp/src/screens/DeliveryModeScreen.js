import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { setDeliveryMode } from '../store/slices/configSlice';

const { width } = Dimensions.get('window');

const DeliveryModeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const selectedSlot = useSelector((state) => state.config.selectedSlot);

  const handleSelectMode = (mode) => {
    dispatch(setDeliveryMode(mode));
    navigation.replace('AppTabs');
  };

  const isExpressActive = !selectedSlot || selectedSlot === 'express' || selectedSlot === 'all';
  const isTomorrowActive = selectedSlot === 'tomorrow' || selectedSlot?.startsWith('tomorrow');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Choose Delivery Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introHeader}>
          <Text style={styles.headerSubtitle}>
            Select how you'd like your fresh meats and seafood delivered to your door.
          </Text>
        </View>

        {/* 1. EXPRESS DELIVERY SOLID CARD */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity 
            style={[
              styles.modeCard, 
              styles.expressCard,
              isExpressActive && styles.activeCardBorder
            ]}
            onPress={() => handleSelectMode('express')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.expressBadge}>
                  <Icon name="lightning-bolt" size={14} color="#FFFFFF" />
                  <Text style={styles.expressBadgeText}>INSTANT • 90 MINS</Text>
                </View>
                {isExpressActive && (
                  <View style={styles.currentTag}>
                    <Icon name="check-circle" size={14} color="#10B981" />
                    <Text style={styles.currentTagText}>CURRENT</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <View style={styles.iconCircleExpress}>
                  <Icon name="flash" size={26} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Express Delivery</Text>
                  <Text style={styles.cardSub}>Delivered fresh in under 90 minutes</Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="check" size={16} color="#7C3AED" />
                  <Text style={styles.featureText}>Live order tracking with assigned rider</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check" size={16} color="#7C3AED" />
                  <Text style={styles.featureText}>Freshly prepped cuts from nearest hub</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.solidCtaButton, 
                  { backgroundColor: isExpressActive ? '#6D28D9' : '#7C3AED' }
                ]}
                onPress={() => handleSelectMode('express')}
                activeOpacity={0.85}
              >
                <Text style={styles.solidCtaText}>
                  {isExpressActive ? '✓ SELECTED FOR SHOPPING' : 'SWITCH TO EXPRESS'}
                </Text>
                <Icon name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. SCHEDULED / TOMORROW SOLID CARD */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity 
            style={[
              styles.modeCard, 
              styles.scheduledCard,
              isTomorrowActive && styles.activeScheduledBorder
            ]}
            onPress={() => handleSelectMode('tomorrow')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.scheduledBadge}>
                  <Icon name="calendar-clock" size={14} color="#FFFFFF" />
                  <Text style={styles.scheduledBadgeText}>NEXT DAY • GUARANTEED SLOTS</Text>
                </View>
                {isTomorrowActive && (
                  <View style={styles.currentTag}>
                    <Icon name="check-circle" size={14} color="#059669" />
                    <Text style={styles.currentTagText}>CURRENT</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <View style={styles.iconCircleScheduled}>
                  <Icon name="calendar-check" size={26} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Scheduled Delivery</Text>
                  <Text style={styles.cardSub}>Tomorrow Morning or Evening Delivery</Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="check" size={16} color="#059669" />
                  <Text style={styles.featureText}>Morning Slot: 7:00 AM - 10:00 AM</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check" size={16} color="#059669" />
                  <Text style={styles.featureText}>Evening Slot: 4:00 PM - 7:00 PM</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check" size={16} color="#059669" />
                  <Text style={styles.featureText}>Full farm-fresh catalog & special cuts available</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.solidCtaButton, 
                  { backgroundColor: isTomorrowActive ? '#047857' : '#059669' }
                ]}
                onPress={() => handleSelectMode('tomorrow')}
                activeOpacity={0.85}
              >
                <Text style={styles.solidCtaText}>
                  {isTomorrowActive ? '✓ SELECTED FOR SHOPPING' : 'SWITCH TO SCHEDULED'}
                </Text>
                <Icon name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Icon name="information" size={16} color="#64748B" />
          <Text style={styles.footerNoteText}>
            You can also switch or fine-tune your specific delivery time window directly during checkout.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: 40,
  },
  introHeader: {
    marginBottom: SPACING.l,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardWrapper: {
    marginBottom: SPACING.l,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  expressCard: {
    backgroundColor: '#FFFFFF',
  },
  scheduledCard: {
    backgroundColor: '#FFFFFF',
  },
  activeCardBorder: {
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  activeScheduledBorder: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  cardHeader: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  expressBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  scheduledBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  currentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  currentTagText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: SPACING.m,
  },
  iconCircleExpress: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleScheduled: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  featuresList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: SPACING.m,
    gap: 8,
    marginBottom: SPACING.l,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  solidCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  solidCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: SPACING.m,
    borderRadius: 10,
    marginTop: SPACING.s,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default DeliveryModeScreen;
