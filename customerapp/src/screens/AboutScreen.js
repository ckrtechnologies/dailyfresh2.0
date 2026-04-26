import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Icon name="leaf" size={60} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Daily Fresh</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            At Daily Fresh, our mission is to deliver the freshest, highest-quality meat and seafood directly to your doorstep. We believe in transparency, quality, and convenience.
          </Text>

          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <View style={styles.featureRow}>
            <Icon name="check-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>100% Fresh & Chemical Free</Text>
          </View>
          <View style={styles.featureRow}>
            <Icon name="check-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Ethically Sourced</Text>
          </View>
          <View style={styles.featureRow}>
            <Icon name="check-circle" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>90 Minutes Express Delivery</Text>
          </View>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Icon name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <Icon name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Refund Policy</Text>
            <Icon name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Follow Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon}>
              <Icon name="facebook" size={30} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Icon name="instagram" size={30} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Icon name="twitter" size={30} color="#1DA1F2" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.copyright}>© 2026 Daily Fresh India Pvt Ltd.</Text>
        <View style={{ height: 40 }} />
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
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
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
    padding: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
  },
  version: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  textSection: {
    marginTop: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.s,
    marginTop: SPACING.l,
  },
  description: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.dark,
    marginLeft: SPACING.s,
  },
  footerLinks: {
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  socialSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.m,
  },
  socialIcons: {
    flexDirection: 'row',
  },
  socialIcon: {
    marginHorizontal: SPACING.l,
  },
  copyright: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: SPACING.xl,
    marginBottom: SPACING.m,
  },
});

export default AboutScreen;
