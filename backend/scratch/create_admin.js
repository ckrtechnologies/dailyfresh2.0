import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin(email, password, fullName) {
  console.log(`--- Creating Super Admin: ${email} ---`);

  // 1. Check if user already exists
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUser = listData?.users?.find(u => u.email === email);

  let userId;
  if (existingUser) {
    console.log('ℹ️ User already exists in Auth, using existing ID...');
    userId = existingUser.id;
  } else {
    // 2. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'admin' }
    });

    if (authError) {
      console.error('❌ Auth Creation Failed:', authError.message);
      console.log('💡 TIP: If you see "Database error", ensure you ran the permission_fix.sql in Supabase Dashboard.');
      return;
    }
    userId = authData.user.id;
    console.log('✅ Auth User Created:', userId);
  }

  // 3. Create/Update Profile manually (just in case trigger fails)
  console.log('Syncing profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert([
      {
        id: userId,
        full_name: fullName,
        email,
        role: 'admin',
        phone: '0000000000'
      }
    ]);

  if (profileError) {
    console.error('❌ Profile Sync Failed:', profileError.message);
    return;
  }

  console.log('✅ Admin Account Ready!');
  console.log('\n--- Admin Credentials ---');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('--------------------------');
}

const ADMIN_EMAIL = 'admin@dailyfresh.com';
const ADMIN_PASS = 'Admin@123';
const ADMIN_NAME = 'Super Admin';

createAdmin(ADMIN_EMAIL, ADMIN_PASS, ADMIN_NAME);
