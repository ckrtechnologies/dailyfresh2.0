import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, THEMES } from '../constants/theme';
import { setSelectedSlot } from '../store/slices/configSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Collapsed pill width — enough for icon + full label + padding
const COLLAPSED_WIDTH = 110;
// Expanded width — uses most of the screen, leaving a small margin on left
const EXPANDED_WIDTH = SCREEN_WIDTH - 24;

const SLOTS = [
  { id: 'express',          label: 'Express',     icon: 'truck-fast' },
  { id: 'today_evening',    label: 'Today Eve',   icon: 'weather-night' },
  { id: 'tmrw_morning', label: 'Tom. Morn',   icon: 'weather-sunny' },
  { id: 'tmrw_evening', label: 'Tom. Eve',    icon: 'weather-night' },
];

const FloatingDeliverySlot = () => {
  const dispatch = useDispatch();
  const { selectedSlot } = useSelector((state) => state.config);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;
  const [expanded, setExpanded] = useState(false);

  const widthAnim  = React.useRef(new Animated.Value(COLLAPSED_WIDTH)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim  = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when collapsed
  useEffect(() => {
    let loop;
    if (!expanded) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loop && loop.stop();
  }, [expanded]);

  const openSlot = () => {
    setExpanded(true); // show expanded content immediately
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: EXPANDED_WIDTH,
        useNativeDriver: false,
        friction: 8,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        delay: 120,
      }),
    ]).start();
  };

  const closeSlot = () => {
    // animate FIRST, only flip state when animation is done
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: COLLAPSED_WIDTH,
        useNativeDriver: false,
        friction: 8,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setExpanded(false); // only now switch back to collapsed content
    });
  };

  const selectSlot = (slotId) => {
    dispatch(setSelectedSlot(slotId));
    closeSlot();
  };

  const currentSlot = SLOTS.find(s => s.id === selectedSlot) || SLOTS[0];

  return (
    // Outer: pulse scale lives here — outside overflow:hidden wrapper
    <Animated.View
      style={[
        styles.container,
        !expanded && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Animated.View
        style={[
          styles.wrapper,
          { width: widthAnim, backgroundColor: activeTheme.primary },
        ]}
      >
        {expanded ? (
          // ── EXPANDED: options row + close button ──
          <>
            <Animated.View
              style={[styles.optionsRow, { opacity: opacityAnim }]}
              pointerEvents="auto"
            >
              {SLOTS.map((slot) => {
                const isActive = slot.id === selectedSlot;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.optionPill,
                      isActive ? styles.optionPillActive : styles.optionPillInactive,
                    ]}
                    onPress={() => selectSlot(slot.id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={slot.icon}
                      size={14}
                      color={isActive ? activeTheme.primary : COLORS.white}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        isActive ? styles.optionLabelActive : styles.optionLabelInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>

            {/* Close button on the far right */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeSlot}
              activeOpacity={0.8}
            >
              <Icon name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </>
        ) : (
          // ── COLLAPSED: entire pill is one touchable, no extra chevron ──
          <TouchableOpacity
            style={styles.collapsedPill}
            onPress={openSlot}
            activeOpacity={0.85}
          >
            <Icon name={currentSlot.icon} size={18} color={COLORS.white} />
            <Text style={styles.collapsedLabel} numberOfLines={1}>
              {currentSlot.label}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 130,
    right: 0,
    zIndex: 9999,
  },
  wrapper: {
    height: 48,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // ── Collapsed ──
  collapsedPill: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  collapsedLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },

  // ── Expanded options ──
  optionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 6,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  optionPillActive: {
    backgroundColor: COLORS.white,
  },
  optionPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: COLORS.dark,
  },
  optionLabelInactive: {
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Close button (expanded only) ──
  closeBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingDeliverySlot;
