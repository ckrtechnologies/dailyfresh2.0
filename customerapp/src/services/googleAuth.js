import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { ENV } from '../config/env';

let isConfigured = false;

export const initGoogleSignIn = () => {
  if (isConfigured) return;
  const webClientId = ENV.GOOGLE_WEB_CLIENT_ID || '373878635569-jberf6o46bjilv0tmab5roj7a5dhip1d.apps.googleusercontent.com';
  try {
    GoogleSignin.configure({
      webClientId: webClientId || undefined,
      offlineAccess: false,
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[GoogleAuth] configure error:', err);
  }
};

export const signInWithGoogleNative = async () => {
  if (!GoogleSignin || typeof GoogleSignin.hasPlayServices !== 'function') {
    return { 
      success: false, 
      error: 'Google Sign-In native module is not linked in this build.' 
    };
  }
  initGoogleSignIn();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken || response.idToken;
    const user = response.data?.user || response.user;

    return {
      success: true,
      idToken,
      user,
      email: user?.email,
      name: user?.name,
      photoUrl: user?.photo,
      googleId: user?.id,
    };
  } catch (error) {
    console.error('[GoogleAuth] signIn error:', error);
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true };
    } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign in already in progress' };
    } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Google Play Services not available' };
    } else {
      return { success: false, error: error.message || 'Google sign-in failed' };
    }
  }
};

/**
 * Open Google OAuth Web SSO in the browser
 */
export const openGoogleBrowserLogin = async () => {
  const authUrl = `${ENV.API_BASE_URL}/auth/google/url?redirect=true&state=mobile`;
  console.log('[GoogleAuth] Opening browser SSO URL:', authUrl);
  try {
    await Linking.openURL(authUrl);
    return { success: true, openedBrowser: true };
  } catch (err) {
    console.error('[GoogleAuth] Error opening browser login:', err);
    return { success: false, error: err.message || 'Could not open browser for Google Login' };
  }
};

/**
 * Parse login callback URI (e.g. dailyfresh://login-callback?token=...&user=...)
 */
export const parseLoginCallbackUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('login-callback')) return null;

  try {
    const queryPart = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(queryPart);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      return { error };
    }

    let user = null;
    if (userRaw) {
      try {
        user = JSON.parse(decodeURIComponent(userRaw));
      } catch (e) {
        user = userRaw;
      }
    }

    if (token) {
      return { token, user };
    }
  } catch (e) {
    console.warn('[GoogleAuth] Failed to parse login callback url:', e);
  }
  return null;
};
