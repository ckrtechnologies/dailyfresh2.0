import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const ReferralsScreen = ({ navigation }) => {
  const referralCode = 'FRESH500';

  const onShare = async () => {
    try {
      await Share.share({
        message: `Get ₹100 off on your first order from Daily Fresh using my code: ${referralCode}. Download now!`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          <Icon name="gift-outline" size={120} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Refer your friends and earn rewards!</Text>
        <Text style={styles.subtitle}>
          Share your referral code with friends. When they place their first order, both of you get ₹100 credit.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity onPress={onShare}>
              <Icon name="content-copy" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
          <Icon name="share-variant" size={24} color={COLORS.white} />
          <Text style={styles.shareBtnText}>Share Code</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
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
    alignItems: 'center',
  },
  imageContainer: {
    marginVertical: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.m,
  },
  codeContainer: {
    width: '100%',
    marginTop: SPACING.xl,
    backgroundColor: '#F9FAFB',
    padding: SPACING.l,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 56,
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  shareBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.s,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.m,
    width: '100%',
    padding: SPACING.m,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  vDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
});

export default ReferralsScreen;
