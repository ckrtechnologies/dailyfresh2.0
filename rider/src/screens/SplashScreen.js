import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  StatusBar,
  Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse Animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate after 3.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <Animated.View 
        style={[
          styles.logoContainer,
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim }
            ]
          }
        ]}
      >
        <Image 
          source={{ uri: 'https://dailyfreshkolkata.in/assets/logo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.textGroup}>
          <Text style={styles.titleText}>Daily Fresh</Text>
          <Text style={styles.tagline}>RIDER PARTNER</Text>
        </View>
      </Animated.View>
      
      <View style={styles.footer}>
        <View style={styles.loaderLine} />
        <Text style={styles.footerText}>Fast • Fresh • Reliable</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  textGroup: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    letterSpacing: 4,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loaderLine: {
    width: 40,
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginBottom: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
