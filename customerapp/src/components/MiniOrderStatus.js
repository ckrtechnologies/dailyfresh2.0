import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { navigationRef } from '../navigation/RootNavigator';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { fetchActiveOrder, hideMiniStatus } from '../store/slices/orderSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100; // Swipe left 100px to show delete

const MiniOrderStatus = () => {
  const dispatch = useDispatch();
  const { activeOrder, hidden } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);

  const translateX = useRef(new Animated.Value(0)).current;


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD) {
          // Keep it swiped to show close button
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!activeOrder || hidden) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Order Placed', icon: 'clock-outline', color: '#EAB308' };
      case 'accepted':
        return { label: 'Order Accepted', icon: 'check-circle-outline', color: COLORS.primary };
      case 'preparing':
        return { label: 'Preparing Items', icon: 'food-variant', color: '#3B82F6' };
      case 'out_for_delivery':
      case 'picked_up':
        return { label: 'Out for Delivery', icon: 'truck-delivery', color: '#8B5CF6' };
      default:
        return { label: status, icon: 'information-outline', color: COLORS.gray };
    }
  };

  const config = getStatusConfig(activeOrder.status);

  return (
    <View style={styles.outerContainer}>
      {/* Background Close Button */}
      <TouchableOpacity 
        style={styles.closeBtn}
        onPress={() => {
          Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
            dispatch(hideMiniStatus());
          });
        }}
      >
        <Icon name="close-circle" size={24} color={COLORS.white} />
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>

      <Animated.View 
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.content}
          onPress={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Main', {
                screen: 'OrderDetail',
                params: { orderId: activeOrder.id }
              });
            }
          }}
          activeOpacity={0.9}
        >
          <View style={[styles.iconBox, { backgroundColor: `${config.color}15` }]}>
             <Icon name={config.icon} size={24} color={config.color} />
          </View>
          
          <View style={styles.info}>
            <Text style={styles.statusLabel}>{config.label}</Text>
            <Text style={styles.orderNo}>Order #{activeOrder.order_number}</Text>
          </View>

          <View style={styles.action}>
             <Text style={styles.trackText}>TRACK</Text>
             <Icon name="chevron-right" size={20} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 80, // Above bottom tabs
    left: SPACING.m,
    right: SPACING.m,
    height: 70,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.dark,
  },
  orderNo: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF4444',
    borderRadius: RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  closeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  }
});

export default MiniOrderStatus;
