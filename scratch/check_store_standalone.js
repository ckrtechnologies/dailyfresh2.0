import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://db.dailyfreshkolkata.in';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStore() {
  const pincode = '700150';
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, pincode, serviceable_pincodes, is_active');

  if (error) {
    console.error('Error fetching stores:', error);
    return;
  }

  console.log(`Searching for stores servicing pincode: ${pincode}`);
  const results = stores.filter(s => {
    const directMatch = s.pincode === pincode;
    const arrayMatch = s.serviceable_pincodes && Array.isArray(s.serviceable_pincodes) && s.serviceable_pincodes.includes(pincode);
    return directMatch || arrayMatch;
  });

  if (results.length > 0) {
    console.log('Found servicing stores:');
    results.forEach(s => {
      console.log(`- ${s.name} (ID: ${s.id}, Active: ${s.is_active})`);
    });
  } else {
    console.log('No store found servicing this pincode.');
    console.log('Available stores and their pincodes:');
    stores.forEach(s => {
        console.log(`- ${s.name}: Main Pincode: ${s.pincode}, Serviceable: ${s.serviceable_pincodes}`);
    });
  }
}

checkStore();
