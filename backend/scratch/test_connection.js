import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Supabase Connection Test ---');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'PRESENT (First 10 chars: ' + supabaseKey.substring(0, 10) + '...)' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('\nTesting Health Check...');
    
    // 1. Test Database Query
    const { data: tables, error: dbError } = await supabase
      .from('settings')
      .select('key, value')
      .limit(1);

    if (dbError) {
      console.error('❌ Database Connection Failed:', dbError.message);
    } else {
      console.log('✅ Database Connection Successful! Found settings:', tables);
    }

    // 2. Test Auth Service
    console.log('\nTesting Auth Service...');
    const { data: users, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1
    });

    if (authError) {
      console.error('❌ Auth Service Connection Failed:', authError.message);
    } else {
      console.log('✅ Auth Service Connection Successful! Found users count:', users.users.length);
    }

    console.log('\n--- Test Completed ---');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
