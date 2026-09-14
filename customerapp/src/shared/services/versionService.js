/**
 * CKR House Standard Version Service
 * Handles mandatory non-skippable force update checks and maintenance mode.
 */

import { Platform } from 'react-native';
import apiClient from '../../api/apiClient';
import packageJson from '../../../package.json';

// Current installed version from package.json (or native bundle)
export const CURRENT_APP_VERSION = packageJson.version || '1.0.0';

export const checkAppVersion = async () => {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const res = await apiClient.get('/app/version-check', {
      params: {
        app: 'customer',
        platform,
        current_version: CURRENT_APP_VERSION,
      },
    });

    if (res?.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    // Fail gracefully on network error during bootstrap so offline cache can still be read
    console.warn('[VersionService] Check failed (possible offline):', error?.message || error);
    return null;
  }
};

export default {
  CURRENT_APP_VERSION,
  checkAppVersion,
};
