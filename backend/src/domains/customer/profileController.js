import * as custRepo from './repository.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getProfile = async (req, res) => {
  try {
    const profile = await custRepo.getProfileById(req.user.id);
    if (!profile) return errorResponse(res, 'User not found', 404);
    return successResponse(res, {
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      avatar_url: profile.avatarUrl,
      created_at: profile.createdAt
    }, 'Profile fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', 500, error.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updateData = {};
    if (full_name !== undefined) updateData.fullName = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatarUrl = avatar_url;

    const updated = await custRepo.updateProfile(req.user.id, updateData);
    return successResponse(res, {
      id: updated.id,
      email: updated.email,
      full_name: updated.fullName,
      phone: updated.phone,
      role: updated.role,
      avatar_url: updated.avatarUrl
    }, 'Profile updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', 500, error.message);
  }
};

export const deleteProfile = async (req, res) => {
  try {
    await custRepo.updateProfile(req.user.id, { isActive: false });
    return successResponse(res, null, 'Account deactivated');
  } catch (error) {
    return errorResponse(res, 'Failed to deactivate account', 500, error.message);
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await custRepo.getAddresses(req.user.id);
    return successResponse(res, { addresses }, 'Addresses fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch addresses', 500, error.message);
  }
};

export const addAddress = async (req, res) => {
  try {
    const address = await custRepo.createAddress(req.user.id, req.body);
    return successResponse(res, address, 'Address added', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to add address', 500, error.message);
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await custRepo.updateAddress(id, req.user.id, req.body);
    return successResponse(res, address, 'Address updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update address', 500, error.message);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await custRepo.deleteAddress(id, req.user.id);
    return successResponse(res, null, 'Address deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete address', 500, error.message);
  }
};

export const updateFcmToken = async (req, res) => {
  const { fcm_token } = req.body;
  try {
    await custRepo.updateProfile(req.user.id, { fcmToken: fcm_token });
    return successResponse(res, null, 'FCM token updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update FCM token', 500, error.message);
  }
};
