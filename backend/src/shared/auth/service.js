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
