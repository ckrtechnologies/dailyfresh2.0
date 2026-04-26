import { supabaseAdmin } from '../config/supabase.js';

const ADMIN_EMAIL = 'admin@dailyfresh.com';
const ADMIN_PASSWORD = 'argosmob';
const ADMIN_NAME = 'Daily Fresh Admin';
const ADMIN_PHONE = '9999999999';

async function setupAdmin() {
  console.log('--- Daily Fresh: Admin Setup ---');

  try {
    // 1. Check if user already exists in profiles
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (existingUser) {
      console.log(`[Info] Admin user ${ADMIN_EMAIL} already exists in database.`);
      return;
    }

    console.log(`[Action] Creating new admin user: ${ADMIN_EMAIL}...`);

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME }
    });

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log(`[Success] Auth user created with ID: ${userId}`);

    // 3. Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        role: 'admin',
        is_active: true
      });

    if (profileError) {
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    console.log('[Success] Admin profile created successfully!');
    console.log('--- Setup Complete ---');

  } catch (error) {
    console.error('[Error] Setup failed:', error.message);
  }
}

setupAdmin();
