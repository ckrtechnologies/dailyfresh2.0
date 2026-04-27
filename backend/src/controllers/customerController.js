import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get authenticated user profile
 */
export const getProfile = async (req, res) => {
  return successResponse(res, { user: req.user }, 'Profile fetched successfully');
};

/**
 * Update authenticated user profile
 */
export const updateProfile = async (req, res) => {
  const { full_name, avatar_url, phone } = req.body;
  if (!full_name && !avatar_url && !phone) {
    return errorResponse(res, 'No profile data to update', 400);
  }
  
  try {
    const metaUpdate = {};
    const dbUpdate = {};
    if (full_name) {
      metaUpdate.full_name = full_name;
      dbUpdate.full_name = full_name;
    }
    if (avatar_url) {
      metaUpdate.avatar_url = avatar_url;
      dbUpdate.avatar_url = avatar_url;
    }
    if (phone !== undefined) {
      metaUpdate.phone = phone;
      dbUpdate.phone = phone;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { user_metadata: metaUpdate }
    );
    if (error) throw error;
    
    // Also update the profiles table if it exists (assuming triggered or explicit)
    if (Object.keys(dbUpdate).length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update(dbUpdate)
        .eq('id', req.user.id);
    }
      
    return successResponse(res, { user: data.user }, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * List all addresses for the customer
 */
export const getAddresses = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) return errorResponse(res, 'Failed to fetch addresses', 400, error);

    return successResponse(res, { addresses: data }, 'Addresses fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Add a new delivery address
 */
export const addAddress = async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, latitude, longitude, is_default } = req.body;

  try {
    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert([{
        user_id: req.user.id,
        label, full_name, phone, line1, line2, city, state, pincode, latitude, longitude, is_default
      }])
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to add address', 400, error);

    return successResponse(res, { address: data }, 'Address added successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update an existing delivery address
 */
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (updateData.is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to update address', 400, error);

    return successResponse(res, { address: data }, 'Address updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Delete a delivery address
 */
export const deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return errorResponse(res, 'Failed to delete address', 400, error);

    return successResponse(res, null, 'Address deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Update FCM Token for push notifications
 */
export const updateFcmToken = async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return errorResponse(res, 'FCM token is required', 400);

  try {
    // 1. Remove this token from any other profiles to prevent duplicates
    await supabaseAdmin
      .from('profiles')
      .update({ fcm_token: null })
      .eq('fcm_token', fcm_token);

    // 2. Assign token to current user
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ fcm_token })
      .eq('id', req.user.id);

    if (error) throw error;
    return successResponse(res, null, 'FCM token updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update FCM token', 500, error);
  }
};
