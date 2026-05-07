import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const ReturnPolicyScreen = ({ navigation }) => {
  const policies = [
    {
      icon: 'clock-fast',
      title: 'Time Window',
      content: 'Since we deliver highly perishable fresh meat and seafood, returns must be requested at the time of delivery or within 1 hour of receiving the order.'
    },
    {
      icon: 'shield-alert',
      title: 'Valid Reasons',
      content: 'We accept returns for items that are damaged, spoiled, or do not match your order. Minor variations in weight (within 5%) are expected due to the nature of fresh cuts.'
    },
    {
      icon: 'package-variant',
      title: 'Condition',
      content: 'Items must be in their original packaging and should not have been cooked or further processed by the customer.'
    },
    {
      icon: 'cash-refund',
      title: 'Refund Process',
      content: 'Approved returns are refunded as Daily Fresh Credits (instantly) or to your original payment method within 3-5 business days.'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return & Refund Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <Icon name="refresh-circle" size={56} color="#F59E0B" />
          <Text style={styles.heroTitle}>Freshness Guaranteed</Text>
          <Text style={styles.heroText}>
            If you're not satisfied with the quality of our products, we're here to make it right.
          </Text>
        </View>

        <View style={styles.policyGrid}>
          {policies.map((policy, index) => (
            <View key={index} style={styles.policyCard}>
              <View style={styles.iconCircle}>
                <Icon name={policy.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.policyTitle}>{policy.title}</Text>
              <Text style={styles.policyContent}>{policy.content}</Text>
            </View>
          ))}
        </View>

        <View style={styles.alertBox}>
          <Icon name="information" size={20} color="#0369A1" />
          <Text style={styles.alertText}>
            For immediate assistance with a return, please call our support line at +91 98765 43210.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.actionBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: RADIUS.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: 40,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: SPACING.m,
  },
  heroText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  },
  policyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  policyCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  policyContent: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    padding: SPACING.m,
    borderRadius: RADIUS.s,
    marginTop: SPACING.xxl,
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    padding: SPACING.l,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReturnPolicyScreen;
