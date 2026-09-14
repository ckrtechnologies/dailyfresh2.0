import * as authService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

/**
 * Register a new customer or rider
 */
export const register = async (req, res) => {
  const { email, password, full_name, phone, role = 'customer' } = req.body;

  if (!email || !password || !full_name) {
    return errorResponse(res, 'Full name, email, and password are required', 400);
  }

  try {
    const data = await authService.registerUser({ email, password, full_name, phone, role });
    return successResponse(res, data, 'Account created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Registration failed', error.status || 500, error);
  }
};

/**
 * Login with Email and Password
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  try {
    const data = await authService.loginUser({ email, password });
    return successResponse(res, data, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Login failed', error.status || 500, error);
  }
};

/**
 * Update authenticated user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    return successResponse(res, data, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Profile update failed', error.status || 500, error);
  }
};

/**
 * Update authenticated user password
 */
export const updatePassword = async (req, res) => {
  const { password, current_password } = req.body;
  if (!password || password.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters', 400);
  }

  try {
    await authService.updatePassword(req.user.id, { password, current_password });
    return successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update password', error.status || 500, error);
  }
};

/**
 * Login or register with Google OAuth
 */
export const loginGoogle = async (req, res) => {
  const { idToken, email, name, photoUrl, googleId } = req.body;

  if (!idToken && !email) {
    return errorResponse(res, 'Google ID token or email is required', 400);
  }

  try {
    const data = await authService.loginWithGoogle({ idToken, email, name, photoUrl, googleId });
    return successResponse(res, data, 'Google authentication successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Google authentication failed', error.status || 500, error);
  }
};

/**
 * Get Google OAuth consent URL or redirect directly to it
 */
export const getGoogleAuthUrl = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return errorResponse(res, 'Google Client ID not configured on backend', 500);
  }

  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    const host = req.get('host');
    if (host && host.includes('api.dailyfreshkolkata.online')) {
      redirectUri = 'https://api.dailyfreshkolkata.online/api/v1/auth/google/callback';
    } else {
      const proto = (host && host.includes('localhost')) ? 'http' : (req.protocol || 'https');
      redirectUri = `${proto}://${host}/api/v1/auth/google/callback`;
    }
  }

  const state = req.query.state || 'mobile';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=select_account&state=${encodeURIComponent(state)}`;

  if (req.query.redirect === 'true' || req.query.mode === 'redirect') {
    return res.redirect(url);
  }

  return successResponse(res, { url, redirect_uri: redirectUri }, 'Google authorization URL generated');
};

/**
 * Handle Google OAuth callback from Browser
 */
export const googleCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('[Google OAuth] Callback error from Google:', error);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DailyFresh - Authentication Cancelled</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; }
            .card { max-width: 400px; margin: 40px auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Cancelled</h2>
            <p>${error}</p>
            <a href="dailyfresh://login-callback?error=${encodeURIComponent(error)}" class="btn">Return to DailyFresh App</a>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    const result = await authService.handleGoogleCallback({
      code,
      state,
      host: req.get('host'),
      protocol: req.protocol,
    });

    const { token, user } = result;
    const userParam = encodeURIComponent(JSON.stringify(user));
    const tokenParam = encodeURIComponent(token);
    const deepLinkUrl = `dailyfresh://login-callback?token=${tokenParam}&user=${userParam}`;

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DailyFresh - Login Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #1e293b; }
            .card { max-width: 420px; margin: 40px auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .icon { width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; font-weight: bold; }
            h2 { margin: 0 0 8px; color: #0f172a; }
            p { color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px 20px; background: #7db434; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          </style>
          <script>
            // Automatic deep link redirection into DailyFresh Mobile App
            window.onload = function() {
              window.location.href = "${deepLinkUrl}";
            };
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Signed In Successfully!</h2>
            <p>Welcome back, <strong>${user.full_name || user.email}</strong>.<br>Redirecting you back to the DailyFresh app...</p>
            <a href="${deepLinkUrl}" class="btn">Open DailyFresh App</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[Google OAuth Callback Error]:', err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DailyFresh - Login Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; }
            .card { max-width: 400px; margin: 40px auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Failed</h2>
            <p>${err.message || 'Something went wrong during Google Sign-In.'}</p>
            <a href="dailyfresh://login-callback?error=${encodeURIComponent(err.message || 'Failed')}" class="btn">Return to App</a>
          </div>
        </body>
      </html>
    `);
  }
};
