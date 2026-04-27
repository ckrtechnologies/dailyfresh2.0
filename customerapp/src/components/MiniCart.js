import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { clearCart } from '../store/slices/cartSlice';
import { navigationRef } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');

const MiniCart = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { totalCount, totalAmount } = useSelector((state) => state.cart);
  const [currentRouteName, setCurrentRouteName] = useState('');

  useEffect(() => {
    // Listener for navigation changes using the global ref
    const onStateChange = () => {
      const route = navigationRef.getCurrentRoute();
      if (route) {
        setCurrentRouteName(route.name);
      }
    };

    // Initial check
    if (navigationRef.isReady()) {
      onStateChange();
    }

    const listener = navigationRef.addListener('state', onStateChange);
    return () => navigationRef.removeListener('state', onStateChange);
  }, []);

  // Hide MiniCart on specific screens where it's redundant or covers UI
  const hiddenScreens = [
    'Cart', 'Checkout', 'Login', 'Signup', 'SplashScreen', 
    'OrderDetail', 'ProductDetail', 'LocationPicker', 'Search',
    'SavedAddresses', 'AddAddress', 'Account', 'EditProfile',
    'Orders', 'Referrals', 'Notifications', 'Support', 'About'
  ];
  
  if (totalCount === 0 || !currentRouteName || hiddenScreens.includes(currentRouteName)) {
    return null;
  }

  const FREE_DELIVERY_THRESHOLD = 499;
  const remaining = FREE_DELIVERY_THRESHOLD - totalAmount;
  const progress = Math.min(totalAmount / FREE_DELIVERY_THRESHOLD, 1);

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        onPress={() => dispatch(clearCart())}
        style={styles.deleteAction}
      >
        <Animated.View style={{ transform: [{ scale: trans }] }}>
          <Icon name="trash-can-outline" size={24} color={COLORS.white} />
          <Text style={styles.deleteText}>Clear</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.outerContainer, { bottom: 70 }]}>
      <Swipeable
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.left}>
              <View style={styles.progressHeader}>
                {remaining > 0 ? (
                  <Text style={styles.msg}>
                    Add <Text style={styles.bold}>₹{Math.ceil(remaining)}</Text> for <Text style={styles.free}>FREE delivery</Text>
                  </Text>
                ) : (
                  <Text style={styles.msg}>
                    <Text style={styles.free}>FREE delivery</Text> unlocked!
                  </Text>
                )}
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.btn}
              onPress={() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Main', {
                    screen: 'AppTabs',
                    params: { screen: 'Cart' }
                  });
                }
              }}
              activeOpacity={0.9}
            >
              <View style={styles.btnInfo}>
                <Text style={styles.btnTitle}>{totalCount} {totalCount === 1 ? 'Item' : 'Items'}</Text>
                <Text style={styles.btnPrice}>₹{totalAmount.toFixed(0)}</Text>
              </View>
              <View style={styles.action}>
                <Text style={styles.actionText}>View Cart</Text>
                <Icon name="chevron-right" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.m,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  progressHeader: {
    marginBottom: 4,
  },
  msg: {
    fontSize: 11,
    color: COLORS.gray,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.dark,
  },
  free: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  btn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  btnInfo: {
    marginRight: 8,
  },
  btnTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '600',
  },
  btnPrice: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 2,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default MiniCart;
