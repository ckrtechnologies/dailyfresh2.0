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

const PrivacyPolicyScreen = ({ navigation }) => {
  const sections = [
    {
      title: '1. Information We Collect',
      content: 'We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, email, phone number, and delivery address.'
    },
    {
      title: '2. How We Use Information',
      content: 'We use your information to process orders, manage your account, improve our services, and communicate with you about promotions and updates.'
    },
    {
      title: '3. Data Security',
      content: 'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.'
    },
    {
      title: '4. Third-Party Sharing',
      content: 'We do not sell your personal data. We only share information with trusted partners necessary to fulfill your orders, such as payment processors and delivery riders.'
    },
    {
      title: '5. Your Rights',
      content: 'You have the right to access, correct, or delete your personal data. Contact us at support@dailyfresh.com for any privacy-related requests.'
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introBox}>
          <Icon name="shield-check" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            At Daily Fresh, we are committed to protecting your personal data and being transparent about how we use it.
          </Text>
          <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have any questions about our privacy practices, please reach out to us.
          </Text>
          <TouchableOpacity style={styles.emailBtn}>
            <Text style={styles.emailText}>privacy@dailyfresh.com</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
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
  introBox: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    backgroundColor: '#F8FAFC',
    padding: SPACING.xl,
    borderRadius: RADIUS.card,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: SPACING.m,
  },
  introText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.m,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  contactBox: {
    marginTop: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.card,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicyScreen;
