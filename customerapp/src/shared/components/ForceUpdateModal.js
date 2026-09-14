/**
 * CKR House Standard Mandatory Force Update Modal
 * Non-skippable, blocking modal for outdated client versions.
 * Traps hardware back button on Android.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, space, radius, elevation } from '../theme';
import Button from './ui/Button';

export const ForceUpdateModal = ({
  visible,
  isMaintenance = false,
  title,
  message,
  updateUrl,
}) => {
  // Trap hardware back button on Android so user cannot bypass
  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true // Block back button completely
      );
      return () => backHandler.remove();
    }
  }, [visible]);

  if (!visible) return null;

  const handleUpdatePress = async () => {
    const defaultStoreUrl = Platform.select({
      ios: 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID',
      android: 'market://details?id=com.dailyfreshkolkata',
      default: 'https://dailyfreshkolkata.online',
    });

    const targetUrl = updateUrl || defaultStoreUrl;

    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        // Fallback to web link if market:// cannot be opened (e.g. emulator without Play Store)
        const webFallback = 'https://play.google.com/store/apps/details?id=com.dailyfreshkolkata';
        await Linking.openURL(webFallback);
      }
    } catch (err) {
      console.error('[ForceUpdateModal] Error opening update URL:', err);
    }
  };

  const defaultTitle = isMaintenance ? 'App Under Maintenance' : 'Update Required';
  const defaultMessage = isMaintenance
    ? 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly.'
    : 'A new and improved version of DailyFresh is available. You must update to the latest version to continue shopping.';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}} // Non-dismissable
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[
            styles.iconWrapper,
            { backgroundColor: isMaintenance ? colors.warningBg : colors.errorBg }
          ]}>
            <Icon
              name={isMaintenance ? 'wrench-clock' : 'rocket-launch'}
              size={48}
              color={isMaintenance ? colors.warning : colors.primary}
            />
          </View>

          <Text style={styles.title}>{title || defaultTitle}</Text>
          <Text style={styles.message}>{message || defaultMessage}</Text>

          {!isMaintenance && (
            <View style={styles.buttonContainer}>
              <Button
                title="Update Now"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleUpdatePress}
                leftIcon={<Icon name="download" size={20} color={colors.textOnPrimary} />}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // High opacity to prevent seeing stale content
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    ...elevation.level3,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: space['2xl'],
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
});

export default ForceUpdateModal;
