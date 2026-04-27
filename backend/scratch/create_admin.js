import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://db.dailyfreshkolkata.in';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin(email, password, fullName) {
  console.log(`--- Creating Super Admin: ${email} ---`);

  // 1. Create User in Auth
  let { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' }
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('ℹ️ User already exists in Auth, updating profile...');
      // Fetch user ID
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData.users.find(u => u.email === email);
      if (!existingUser) {
        console.error('❌ Could not find existing user ID');
        return;
      }
      userId = existingUser.id;
    } else {
      console.error('❌ Auth Creation Failed:', authError.message);
      return;
    }
  } else {
    userId = authData.user.id;
    console.log('✅ Auth User Created:', userId);
  }

  // 2. Create Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert([
      { 
        id: userId, 
        full_name: fullName, 
        email, 
        role: 'admin',
        phone: '0000000000' // Placeholder
      }
    ]);

  if (profileError) {
    console.error('❌ Profile Creation Failed:', profileError.message);
    // Cleanup auth user if profile fails
    await supabase.auth.admin.deleteUser(userId);
    return;
  }

  console.log('✅ Profile Created Successfully!');
  console.log('\n--- Admin Credentials ---');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('--------------------------');
}

// EDIT THESE VALUES
const ADMIN_EMAIL = 'admin@dailyfresh.com';
const ADMIN_PASS = 'Admin@123';
const ADMIN_NAME = 'Super Admin';

createAdmin(ADMIN_EMAIL, ADMIN_PASS, ADMIN_NAME);
