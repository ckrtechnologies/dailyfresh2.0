import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authRepo from './repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dailyfresh_jwt_secret_key_2026_super_secure_isolated';

/**
 * Generate standard signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Register a new user
 */
export const registerUser = async ({ email, password, full_name, phone, role = 'customer' }) => {
  const cleanEmail = email.trim().toLowerCase();

  const existing = await authRepo.findByEmail(cleanEmail);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newProfile = await authRepo.createProfile({
    fullName: full_name,
    email: cleanEmail,
    phone: phone || null,
    passwordHash,
    role: role || 'customer',
    authProvider: 'local',
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
    isActive: true
  });

  const token = generateToken(newProfile);

  return {
    access_token: token,
    token,
    user: {
      id: newProfile.id,
      email: newProfile.email,
      full_name: newProfile.fullName,
      phone: newProfile.phone,
      role: newProfile.role,
      avatar_url: newProfile.avatarUrl,
      created_at: newProfile.createdAt
    }
  };
};

/**
 * Authenticate existing user with email and password
 */
export const loginUser = async ({ email, password }) => {
  const cleanEmail = email.trim().toLowerCase();

  const user = await authRepo.findByEmail(cleanEmail);
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Your account has been deactivated. Please contact support.');
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  let storeId = null;
  if (user.role === 'store_manager') {
    const store = await authRepo.findStoreByManagerUserId(user.id);
    if (store) storeId = store.id;
  }

  const token = generateToken(user);

  return {
    access_token: token,
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatarUrl,
      store_id: storeId,
      created_at: user.createdAt
    }
  };
};

/**
 * Update authenticated user profile details
 */
export const updateProfile = async (userId, { full_name, phone, avatar_url }) => {
  const updateData = {};
  if (full_name !== undefined) updateData.fullName = full_name;
  if (phone !== undefined) updateData.phone = phone;
  if (avatar_url !== undefined) updateData.avatarUrl = avatar_url;

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No data to update');
    err.status = 400;
    throw err;
  }

  const updated = await authRepo.updateProfile(userId, updateData);
  if (!updated) {
    const err = new Error('User profile not found');
    err.status = 404;
    throw err;
  }

  return {
    user: {
      id: updated.id,
      email: updated.email,
      full_name: updated.fullName,
      phone: updated.phone,
      role: updated.role,
      avatar_url: updated.avatarUrl
    }
  };
};

/**
 * Update authenticated user password
 */
export const updatePassword = async (userId, { password, current_password }) => {
  if (current_password) {
    const user = await authRepo.findById(userId);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(current_password, user.passwordHash);
      if (!isMatch) {
        const err = new Error('Current password is incorrect');
        err.status = 400;
        throw err;
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await authRepo.updateProfile(userId, { passwordHash });
  return { success: true };
};

/**
 * Authenticate or register with Google OAuth
 */
export const loginWithGoogle = async ({ idToken, email, name, photoUrl, googleId }) => {
  let verifiedEmail = email;
  let verifiedName = name;
  let verifiedPicture = photoUrl;
  let verifiedSub = googleId;

  if (idToken) {
    let verified = false;
    try {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID] : undefined
      });
      const payload = ticket.getPayload();
      if (payload) {
        verifiedEmail = payload.email || verifiedEmail;
        verifiedName = payload.name || verifiedName;
        verifiedPicture = payload.picture || verifiedPicture;
        verifiedSub = payload.sub || verifiedSub;
        verified = true;
      }
    } catch (tokenErr) {
      console.warn('[GoogleAuth] verifyIdToken failed, attempting tokeninfo endpoint fallback:', tokenErr.message);
    }

    if (!verified) {
      try {
        const axios = (await import('axios')).default;
        const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { timeout: 5000 });
        if (res.data && res.data.email) {
          verifiedEmail = res.data.email;
          verifiedName = res.data.name || verifiedName;
          verifiedPicture = res.data.picture || verifiedPicture;
          verifiedSub = res.data.sub || verifiedSub;
          verified = true;
        }
      } catch (fallbackErr) {
        console.warn('[GoogleAuth] tokeninfo fallback failed:', fallbackErr.message);
        if (!verifiedEmail) throw new Error('Invalid Google token');
      }
    }
  }

  if (!verifiedEmail) {
    const err = new Error('Google email is required');
    err.status = 400;
    throw err;
  }

  const cleanEmail = verifiedEmail.trim().toLowerCase();
  let user = null;
  if (verifiedSub) {
    user = await authRepo.findByGoogleId(verifiedSub);
  }
  if (!user) {
    user = await authRepo.findByEmail(cleanEmail);
  }

  if (!user) {
    user = await authRepo.createProfile({
      fullName: verifiedName || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: null,
      role: 'customer',
      authProvider: 'google',
      googleId: verifiedSub || null,
      avatarUrl: verifiedPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
      isActive: true
    });
  } else if (!user.googleId && verifiedSub) {
    user = await authRepo.updateProfile(user.id, {
      googleId: verifiedSub,
      authProvider: user.authProvider || 'google'
    });
  }

  const token = generateToken(user);

  return {
    access_token: token,
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatarUrl,
      created_at: user.createdAt
    }
  };
};

/**
 * Handle Google OAuth 2.0 Authorization Code callback from Browser
 */
export const handleGoogleCallback = async ({ code, state, host, protocol }) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on backend');
  }

  // Determine redirect URI used
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    if (host && host.includes('api.dailyfreshkolkata.online')) {
      redirectUri = 'https://api.dailyfreshkolkata.online/api/v1/auth/google/callback';
    } else {
      const proto = (host && host.includes('localhost')) ? 'http' : (protocol || 'https');
      redirectUri = `${proto}://${host}/api/v1/auth/google/callback`;
    }
  }

  // Exchange authorization code for tokens
  const axios = (await import('axios')).default;
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const { id_token, access_token } = tokenResponse.data;

  // Retrieve user info from Google
  let userInfo = null;
  if (access_token) {
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      userInfo = userRes.data;
    } catch (uErr) {
      console.warn('[GoogleAuth] Failed to fetch userinfo with access_token, fallback to id_token:', uErr.message);
    }
  }

  return await loginWithGoogle({
    idToken: id_token,
    email: userInfo?.email,
    name: userInfo?.name,
    photoUrl: userInfo?.picture,
    googleId: userInfo?.id
  });
};
