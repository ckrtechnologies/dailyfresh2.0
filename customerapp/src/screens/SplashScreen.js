import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions, StatusBar, Text } from 'react-native';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Sizes
const CIRCLE_SIZE  = width * 0.52;  // white backdrop circle
const LOGO_SIZE    = CIRCLE_SIZE * 0.72; // logo inside the circle
const GLOW_SIZE    = width * 0.72;  // soft glow behind the circle
const RING_SIZE    = CIRCLE_SIZE + 32; // pulsing ring

const SplashScreen = () => {
  // --- Animated values ---
  const circleScale  = useRef(new Animated.Value(0.4)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;

  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.7)).current;

  const textOpacity      = useRef(new Animated.Value(0)).current;
  const textTranslateY   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Step 1: white circle pops in (spring bounce)
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(circleOpacity, { toValue: 1,   duration: 400,  useNativeDriver: true }),
        Animated.spring(circleScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Step 3: logo fades in AFTER circle is solid
    Animated.sequence([
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1,   duration: 600,  useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    // Step 5: brand text slides up
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(textOpacity,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Transparent container for animation */}
      <Animated.View
        style={[
          styles.logoCircle,
          { opacity: circleOpacity, transform: [{ scale: circleScale }] },
        ]}
      >
        {/* Logo inside the white circle */}
        <Animated.Image
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand text */}
      <Animated.View
        style={[
          styles.textContainer,
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
        ]}
      >
        <Text style={styles.brandName}>Daily Fresh</Text>
        <View style={styles.dividerLine} />
        <Text style={styles.tagline}>Quality You Can Trust</Text>
      </Animated.View>

      {/* Footer dots */}
      <View style={styles.footer}>
        <View style={[styles.dot, { opacity: 0.5 }]} />
        <View style={[styles.dot, { opacity: 1, width: 20, backgroundColor: COLORS.white }]} />
        <View style={[styles.dot, { opacity: 0.5 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A0C0E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Transparent container for logo bounce */
  logoCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },

  /* Text block */
  textContainer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  brandName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  dividerLine: {
    width: 56,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
    marginVertical: 8,
  },
  tagline: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 4.5,
    textTransform: 'uppercase',
    opacity: 0.8,
    includeFontPadding: false,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
});

export default SplashScreen;
