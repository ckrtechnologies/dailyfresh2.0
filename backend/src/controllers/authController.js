import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Register a new customer
 */
export const register = async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone }
    });

    if (authError) return errorResponse(res, authError.message, 400);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name,
          email,
          phone,
          role: 'customer'
        }
      ])
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return errorResponse(res, 'Failed to create user profile', 400, profileError);
    }

    return successResponse(res, { user: profile }, 'Account created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Registration failed', 500, error);
  }
};

/**
 * Login with Email and Password
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return errorResponse(res, error.message, 401);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If store_manager, fetch assigned store_id
    if (profile?.role === 'store_manager') {
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_user_id', profile.id)
        .limit(1)
        .maybeSingle();
      if (store) profile.store_id = store.id;
    }

    return successResponse(res, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile
    }, 'Login successful');
  } catch (error) {
    return errorResponse(res, 'Login failed', 500, error);
  }
};
export const updateProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, phone })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Profile update failed', 400, error);
    return successResponse(res, { user: data }, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error', 500, error);
  }
};

export const updatePassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return errorResponse(res, 'Password must be at least 6 characters', 400);

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password });
    if (error) return errorResponse(res, 'Failed to update password', 400, error);
    return successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error', 500, error);
  }
};
