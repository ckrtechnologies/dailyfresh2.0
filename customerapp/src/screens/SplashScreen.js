import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Image 
          source={require('../assets/logo.jpg')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: width * 0.7,
  },
});

export default SplashScreen;
