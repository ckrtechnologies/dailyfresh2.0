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
