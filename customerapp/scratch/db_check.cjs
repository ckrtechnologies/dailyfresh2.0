
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://db.dailyfreshkolkata.in';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: stores } = await supabase.from('stores').select('id, name, pincode, serviceable_pincodes');
  console.log('--- STORES ---');
  console.log(JSON.stringify(stores, null, 2));

  const { data: products } = await supabase.from('products').select('id, name, store_id').limit(20);
  console.log('--- PRODUCTS (sample) ---');
  console.log(JSON.stringify(products, null, 2));
}

check();
