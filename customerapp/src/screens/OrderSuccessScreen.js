import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = ({ route, navigation }) => {
  const { orderId: rawOrderId, order_id, id } = route.params || {};
  const orderId = rawOrderId || order_id || id;
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const handleViewOrder = () => {
    if (orderId) {
      try {
        navigation.navigate('OrderDetail', { orderId, order: { id: orderId } });
      } catch (e) {
        navigation.navigate('Orders');
      }
    } else {
      navigation.navigate('Orders');
    }
  };

  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={activeTheme.primary} />
      
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
          ]}
        >
          <View style={[styles.circleBg, { backgroundColor: activeTheme.primary, shadowColor: activeTheme.primary }]}>
            <Icon name="check-bold" size={60} color={COLORS.white} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>
            Your fresh items are being prepared and will be delivered shortly.
          </Text>
          
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumberLabel}>Order Reference:</Text>
            <Text style={styles.orderNumberValue}>#{orderId?.slice(-8).toUpperCase() || 'SUCCESS'}</Text>
          </View>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.viewOrderBtn, { backgroundColor: activeTheme.primary }]}
            onPress={handleViewOrder}
          >
            <Text style={styles.viewOrderText}>View My Order</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.continueBtn, { borderColor: activeTheme.primary }]}
            onPress={() => navigation.navigate('AppTabs', { screen: 'Home' })}
          >
            <Text style={[styles.continueText, { color: activeTheme.primary }]}>Continue Shopping</Text>
            <Icon name="arrow-right" size={20} color={activeTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  circleBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.xl,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.m,
    marginBottom: SPACING.xxl,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  orderNumberValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  viewOrderBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  viewOrderText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: COLORS.white,
    width: '100%',
    paddingVertical: 16,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  continueText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OrderSuccessScreen;
