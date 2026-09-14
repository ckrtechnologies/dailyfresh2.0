/**
 * CKR House Standard Button Component
 * Mirrors Section 3.1 of DESIGN.md
 * 
 * Rules:
 * 1. Anti-double-submit: completely disables press events when loading or disabled.
 * 2. Fixed width loading: spinner replaces label without layout collapse or jumps.
 * 3. 44x44 minimum touch target.
 * 4. Variants: primary, secondary, ghost, destructive.
 * 5. Sizes: lg (52h), md (44h), sm (36h).
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { colors, typography, radius } from '../../theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'destructive'
  size = 'md',        // 'lg' (52) | 'md' (44) | 'sm' (36)
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  style,
  textStyle,
  ...props
}) => {
  // Lock layout width when measured so loading spinner never collapses width
  const [lockedWidth, setLockedWidth] = useState(null);

  const isDisabled = disabled || loading;

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && !lockedWidth) {
      setLockedWidth(width);
    }
  };

  // Determine button background and border styles
  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'destructive':
        return styles.destructiveContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  // Determine button text color
  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      case 'destructive':
        return styles.destructiveText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  // Determine button height per size
  const getSizeContainerStyle = () => {
    switch (size) {
      case 'lg':
        return styles.sizeLg;
      case 'sm':
        return styles.sizeSm;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'secondary' || variant === 'ghost') {
      return colors.primary;
    }
    return colors.textOnPrimary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      onPress={onPress}
      onLayout={handleLayout}
      style={[
        styles.baseButton,
        getSizeContainerStyle(),
        getVariantContainerStyle(),
        fullWidth && styles.fullWidth,
        lockedWidth && loading ? { minWidth: lockedWidth } : null,
        isDisabled && !loading && styles.disabledContainer,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
    >
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color={getSpinnerColor()} />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
          <Text
            numberOfLines={1}
            style={[
              styles.baseText,
              getVariantTextStyle(),
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    // Ensures min 44x44 touch target even for small buttons
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  sizeLg: {
    height: 52,
    paddingHorizontal: 24,
  },
  sizeMd: {
    height: 44,
    paddingHorizontal: 16,
  },
  sizeSm: {
    height: 36,
    minHeight: 44, // Preserves 44px touch target per accessibility rules
    paddingHorizontal: 12,
  },
  // Variants
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  destructiveContainer: {
    backgroundColor: colors.error,
  },
  // Disabled state
  disabledContainer: {
    opacity: 0.4,
  },
  // Content & Text
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  baseText: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.textOnPrimary,
  },
  secondaryText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  destructiveText: {
    color: colors.textOnPrimary,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
