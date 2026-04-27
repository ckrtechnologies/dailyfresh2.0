import { supabaseAdmin } from '../config/supabase.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication Middleware
 * Verifies Supabase JWT and attaches user profile to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authorization token missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify JWT with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    // 2. Fetch user profile and role from the 'profiles' table
    let { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 3. AUTO-CREATE PROFILE for SSO Users (Google/Apple etc)
    if (!profile) {
      console.log(`[Auth] Creating missing profile for SSO user: ${user.email}`);
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
            phone: user.user_metadata?.phone || '0000000000', // Placeholder
            role: 'customer',
            avatar_url: user.user_metadata?.avatar_url || null
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('[Auth Error] Failed to auto-create profile:', createError);
        return errorResponse(res, 'User profile not found and could not be created', 404);
      }
      profile = newProfile;
    }

    // 3. If Store Manager, find their assigned store
    if (profile.role === 'store_manager') {
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('manager_user_id', profile.id)
        .maybeSingle(); // Use maybeSingle to avoid errors if not found
      
      if (store) {
        profile.store_id = store.id;
      } else {
        // If they are a manager but have no store, we set it to null clearly
        profile.store_id = null;
      }
    }

    // 4. Attach user and profile to request object
    req.user = profile;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 500, error);
  }
};

/**
 * Role-Based Access Control Middleware
 * @param {Array} allowedRoles 
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, `Forbidden: ${req.user ? req.user.role : 'Guest'} does not have access`, 403);
    }
    next();
  };
};
