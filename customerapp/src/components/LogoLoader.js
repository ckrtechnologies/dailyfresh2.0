import React, { useEffect, useRef } from 'react';
import { View, Animated, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const LogoLoader = ({ size = 80 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing and slight rotation animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ 
        transform: [
          { scale: scaleAnim },
          // { rotate: rotation } // Optional: add slow rotation
        ] 
      }}>
        <Image
          source={require('../assets/logo.jpg')}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LogoLoader;
