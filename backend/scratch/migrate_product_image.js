import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration: Add image_url to products...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;'
  });

  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log('RPC exec_sql not found. You may need to run this manually in the Supabase SQL Editor:');
      console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');
    } else {
      console.error('Migration failed:', error);
    }
  } else {
    console.log('Migration successful!');
  }
}

runMigration();
