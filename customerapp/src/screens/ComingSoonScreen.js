import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { THEMES, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'lightning-bolt', label: 'Express Delivery', desc: '90 min from farm to table' },
  { icon: 'leaf', label: '100% Fresh', desc: 'No frozen, only fresh cuts' },
  { icon: 'shield-check', label: 'Quality Assured', desc: 'Hygiene & safety certified' },
  { icon: 'truck-fast', label: 'Free Delivery', desc: 'On orders above ₹299' },
];

const ComingSoonScreen = ({ pincode: propPincode, showHeader = true }) => {
  const navigation = useNavigation();
  const { selectedSlot } = useSelector((state) => state.config);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useSelector((state) => state.location);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const displayPincode = propPincode || location.pincode;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const wave = Animated.loop(
      Animated.timing(waveAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    wave.start();

    return () => { pulse.stop(); wave.stop(); };
  }, []);

  const waveScale1 = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const waveScale2 = waveAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.8, 2.5] });
  const waveOpacity1 = waveAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 0.2, 0] });
  const waveOpacity2 = waveAnim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 0.4, 0.1, 0] });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={activeTheme.primary} barStyle="light-content" />
      {showHeader && (
        <View style={[styles.header, { backgroundColor: activeTheme.primary }]}>
          <View style={styles.headerLogo}>
            <Icon name="fish" size={22} color="#fff" />
            <Text style={styles.headerTitle}>Daily Fresh</Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Account')}>
              <Icon name="account-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={styles.illustrationContainer}>
            <Animated.View style={[styles.ring, { transform: [{ scale: waveScale1 }], opacity: waveOpacity1, borderColor: activeTheme.primary }]} />
            <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: waveScale2 }], opacity: waveOpacity2, borderColor: activeTheme.primary }]} />
            <Animated.View style={[styles.iconCircle, { backgroundColor: activeTheme.primary + '18', transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.iconInner, { backgroundColor: activeTheme.primary }]}>
                <Icon name="map-marker-radius-outline" size={48} color="#fff" />
              </View>
            </Animated.View>
          </View>

          <Text style={styles.eyebrow}>
            {displayPincode ? `📍 Pincode ${displayPincode}` : '📍 Your Location'}
          </Text>
          <Text style={styles.headline}>We're Coming{'\n'}Your Way!</Text>
          <Text style={styles.subtext}>
            Daily Fresh isn't available in your area yet, but we're expanding fast.
            Fresh fish & meat delivery is just around the corner — literally.
          </Text>

          <View style={[styles.etaCard, { borderColor: activeTheme.primary + '40' }]}>
            <View style={styles.etaRow}>
              <Icon name="rocket-launch-outline" size={28} color={activeTheme.primary} />
              <View style={styles.etaText}>
                <Text style={[styles.etaTitle, { color: activeTheme.primary }]}>Launching Soon</Text>
                <Text style={styles.etaDesc}>We're actively building in your area. Check back soon!</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>What Daily Fresh offers:</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.label} style={[styles.featureCard, { borderColor: activeTheme.primary + '25' }]}>
                <View style={[styles.featureIconBg, { backgroundColor: activeTheme.primary + '15' }]}>
                  <Icon name={f.icon} size={24} color={activeTheme.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: activeTheme.primary }]}
            onPress={() => navigation.navigate(isAuthenticated ? 'SavedAddresses' : 'LocationPicker', { selectMode: true, changeLocation: true })}
            activeOpacity={0.88}
          >
            <Icon name="map-marker-plus-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Try a Different Location</Text>
          </TouchableOpacity>

          {!isAuthenticated && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: activeTheme.primary + '60' }]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: activeTheme.primary }]}>Login / Create Account</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.footerNote}>🐟 Freshness guaranteed • Farm-to-table delivery</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: 14,
    paddingTop: 48,
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5 },
  headerBtn: { padding: 4 },
  scrollContent: { paddingBottom: 40 },
  content: { padding: SPACING.l, alignItems: 'center' },
  illustrationContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  ring2: { width: 100, height: 100 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  eyebrow: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 14,
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
    maxWidth: width * 0.85,
  },
  etaCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  etaRow: { flexDirection: 'row', alignItems: 'center' },
  etaText: { flex: 1, marginLeft: 14 },
  etaTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  etaDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#374151', alignSelf: 'flex-start', marginBottom: 14 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32, width: '100%' },
  featureCard: {
    width: (width - SPACING.l * 2 - 12) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  featureIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  featureDesc: { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    borderRadius: 27,
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
  footerNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
});

export default ComingSoonScreen;
