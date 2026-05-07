import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  // --- Animated values ---
  const colorAnim = useRef(new Animated.Value(0)).current;
  
  // Phase Texts (Discreet)
  const p1Opacity = useRef(new Animated.Value(0)).current;
  const p2Opacity = useRef(new Animated.Value(0)).current;
  const p3Opacity = useRef(new Animated.Value(0)).current;
  
  // Logo Phase
  const rayOpacity = useRef(new Animated.Value(0)).current;
  const rayScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. CINEMATIC SEQUENCE START (6 Seconds Total)
    Animated.sequence([
      // --- PART 1: THE TEXT PHASES (3 Seconds) ---
      
      // Phase 1: Morning (0s - 1s)
      Animated.parallel([
        Animated.timing(colorAnim, { toValue: 0.25, duration: 800, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(p1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(p1Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),

      // Phase 2: Evening (1s - 2s)
      Animated.parallel([
        Animated.timing(colorAnim, { toValue: 0.5, duration: 800, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(p2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(p2Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),

      // Phase 3: Express (2s - 3s)
      Animated.parallel([
        Animated.timing(colorAnim, { toValue: 0.75, duration: 800, useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(p3Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(p3Opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),

      // --- PART 2: THE GRAND REVEAL (Utilizing 3 Full Seconds) ---
      
      // Step A: Ray of Light Forms First (3.0s - 4.0s)
      Animated.parallel([
        Animated.timing(colorAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(rayOpacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.spring(rayScale, { toValue: 1.5, tension: 10, friction: 6, useNativeDriver: true }),
      ]),

      // Step B: Logo Reveal (4.0s - 5.0s)
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 20, friction: 5, useNativeDriver: true }),
      ]),

      // Step C: Tagline & Final Settle (5.0s - 6.0s)
      Animated.timing(taglineOpacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
    ]).start();

  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#012a21', '#7A0C0E', '#064E3B', '#6B21A8', '#012a21'], // Deep Emerald -> Maroon -> Green -> Purple -> Deep Emerald
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Central Ray of Light (Forms First in Reveal Phase) */}
      <Animated.View style={[styles.ray, { 
        transform: [{ scale: rayScale }],
        opacity: rayOpacity
      }]} />

      <View style={styles.content}>
        {/* PHASE TEXTS (Sequential & Discreet) */}
        <Animated.Text style={[styles.phaseText, { opacity: p1Opacity }]}>Morning</Animated.Text>
        <Animated.Text style={[styles.phaseText, { opacity: p2Opacity }]}>Evening</Animated.Text>
        <Animated.Text style={[styles.phaseText, { opacity: p3Opacity }]}>Express</Animated.Text>

        {/* THE MAIN LOGO */}
        <Animated.View style={[styles.logoWrapper, { 
          opacity: logoOpacity, 
          transform: [{ scale: logoScale }] 
        }]}>
          <Text style={styles.brandName}>DAILY</Text>
          <View style={styles.freshContainer}>
            <Text style={styles.freshText}>FRESH</Text>
          </View>
        </Animated.View>

        {/* TAGLINE */}
        <Animated.View style={[styles.taglineRow, { opacity: taglineOpacity }]}>
          <View style={styles.line} />
          <Text style={styles.taglineText}>PREMIUM QUALITY DELIVERED</Text>
          <View style={styles.line} />
        </Animated.View>
      </View>

      <View style={styles.bottomBranding}>
        <Text style={styles.estText}>ESTD. 2024</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ray: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 30,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  phaseText: {
    position: 'absolute',
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 84,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 14,
    lineHeight: 84,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  freshContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 25,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  freshText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 16,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 15,
  },
  taglineText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 5,
    opacity: 0.9,
  },
  line: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 60,
  },
  estText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 4,
  },
});

export default SplashScreen;
