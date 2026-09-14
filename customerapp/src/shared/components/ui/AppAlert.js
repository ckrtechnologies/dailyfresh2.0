/**
 * CKR House Standard Alert Dialog Component
 * Mirrors Section 2.3 & 3.6 of DESIGN.md
 * 
 * Supports: 'info' | 'success' | 'warning' | 'error' | 'destructiveConfirm'
 * Rules:
 * - Max 2 buttons
 * - Destructive action explicitly named (never generic "OK")
 * - Non-dismissable if explicitly configured
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, radius, elevation, space, THEMES } from '../../theme';

export const AppAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'destructiveConfirm'
  buttons = [],
  dismissable = true,
  onClose,
}) => {
  const selectedSlot = useSelector((state) => state.config?.selectedSlot);
  const activeTheme = THEMES[selectedSlot] || THEMES.all;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getAlertVisuals = () => {
    switch (type) {
      case 'success':
        return {
          name: 'check-circle',
          color: colors.success,
          bgColor: colors.successBg,
        };
      case 'error':
        return {
          name: 'alert-circle',
          color: colors.error,
          bgColor: colors.errorBg,
        };
      case 'warning':
        return {
          name: 'alert',
          color: colors.warning,
          bgColor: colors.warningBg,
        };
      case 'destructiveConfirm':
        return {
          name: 'alert-octagon',
          color: colors.error,
          bgColor: colors.errorBg,
        };
      case 'info':
      default:
        return {
          name: 'information',
          color: activeTheme?.primary || colors.primary,
          bgColor: colors.infoBg,
        };
    }
  };

  const visuals = getAlertVisuals();

  // Normalize buttons: default to a single "OK" button if none provided
  const resolvedButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', onPress: () => {} }];

  const handleBackdropPress = () => {
    if (dismissable && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: visuals.bgColor }]}>
              <Icon name={visuals.name} size={32} color={visuals.color} />
            </View>

            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View
            style={[
              styles.buttonContainer,
              resolvedButtons.length === 1 && styles.singleButtonContainer,
            ]}
          >
            {resolvedButtons.map((btn, index) => {
              const isLast = index === resolvedButtons.length - 1;
              const isDestructive = btn.destructive || type === 'destructiveConfirm' && isLast;

              let buttonBg = 'transparent';
              let buttonTextColor = activeTheme?.primary || colors.primary;

              if (isDestructive) {
                buttonBg = colors.error;
                buttonTextColor = colors.textOnPrimary;
              } else if (isLast) {
                buttonBg = activeTheme?.primary || colors.primary;
                buttonTextColor = colors.textOnPrimary;
              }

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    { backgroundColor: buttonBg },
                    index > 0 && { marginLeft: space.sm },
                  ]}
                  onPress={() => {
                    if (onClose) onClose();
                    if (btn.onPress) {
                      setTimeout(() => {
                        btn.onPress();
                      }, 100);
                    }
                  }}
                >
                  <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    ...elevation.level3,
  },
  content: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  singleButtonContainer: {
    justifyContent: 'center',
  },
  button: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.bodyBold,
  },
});

export default AppAlert;
