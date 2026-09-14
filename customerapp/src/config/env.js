/**
 * CKR House Standard Environment Gateway
 * This is the ONLY file in the mobile client allowed to access Config / process.env.
 * All other files MUST import configuration from this module.
 */
import Config from 'react-native-config';

// Primary client environment variable: exactly 1 allowed per CKR architecture
const API_BASE_URL = Config.API_BASE_URL || Config.API_URL || 'https://api.dailyfreshkolkata.online/api/v1';

export const ENV = {
  API_BASE_URL,
  // Alias for backward compatibility
  API_URL: API_BASE_URL,
  IS_DEV: __DEV__,
  APP_NAME: 'DailyFresh Kolkata',
  APP_ID: 'com.dailyfreshkolkata',
  DEFAULT_TIMEOUT_MS: 15000,
  GOOGLE_WEB_CLIENT_ID: Config.GOOGLE_WEB_CLIENT_ID || '',
};

// Freeze the configuration object to prevent runtime mutation
Object.freeze(ENV);

export default ENV;
