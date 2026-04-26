import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration: Renaming cooking_instructions to cooking_guide...');
  
  // Note: Supabase JS doesn't support direct DDL via .from(). 
  // We usually need a custom function for this.
  // But we can try to use a dummy RPC if it exists, or just provide the SQL.
  
  console.log('SQL to execute:');
  console.log('ALTER TABLE products RENAME COLUMN cooking_instructions TO cooking_guide;');
  
  // Since we cannot run DDL directly via JS client, we will provide the migration file.
}

runMigration();
