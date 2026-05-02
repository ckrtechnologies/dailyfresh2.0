const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://db.dailyfreshkolkata.in';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('name, delivery_options')
    .ilike('name', '%mutton curry cut%')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return;
  }

  console.log('Product Name:', data.name);
  console.log('Delivery Options (Raw):', data.delivery_options);
}

checkProduct();
