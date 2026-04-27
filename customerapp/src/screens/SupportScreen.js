import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const SupportScreen = ({ navigation }) => {
  const contactMethods = [
    {
      icon: 'whatsapp',
      label: 'WhatsApp Chat',
      value: '+91 98765 43210',
      action: () => Linking.openURL('whatsapp://send?phone=919876543210'),
      color: '#25D366',
    },
    {
      icon: 'phone-outline',
      label: 'Call Us',
      value: '1800-123-4567',
      action: () => Linking.openURL('tel:18001234567'),
      color: COLORS.primary,
    },
    {
      icon: 'email-outline',
      label: 'Email Support',
      value: 'support@dailyfresh.com',
      action: () => Linking.openURL('mailto:support@dailyfresh.com'),
      color: '#EA4335',
    }
  ];

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order in the "My Orders" section of your profile.' },
    { q: 'What are the delivery charges?', a: 'We offer free delivery on orders above ₹499. Below that, a flat ₹30 fee applies.' },
    { q: 'Can I cancel my order?', a: 'Orders can be cancelled within 15 minutes of placement before they are processed.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactContainer}>
          {contactMethods.map((method, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.contactCard}
              onPress={method.action}
            >
              <View style={[styles.iconBox, { backgroundColor: method.color + '15' }]}>
                <Icon name={method.icon} size={28} color={method.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{method.label}</Text>
                <Text style={styles.contactValue}>{method.value}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.chatBtn} onPress={() => Linking.openURL('whatsapp://send?phone=919876543210')}>
          <Icon name="whatsapp" size={24} color={COLORS.white} />
          <Text style={styles.chatBtnText}>Chat on WhatsApp</Text>
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
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  content: {
    padding: SPACING.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.m,
    marginLeft: SPACING.s,
  },
  contactContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    overflow: 'hidden',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  contactLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 2,
  },
  faqContainer: {
    marginTop: SPACING.s,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.s,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  chatBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.l,
    marginBottom: SPACING.xl,
  },
  chatBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.s,
  },
});

export default SupportScreen;
