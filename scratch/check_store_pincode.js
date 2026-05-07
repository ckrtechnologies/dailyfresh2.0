import { supabaseAdmin } from '../backend/src/config/supabase.js';

async function checkStore() {
  const pincode = '700150';
  const { data: stores, error } = await supabaseAdmin
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
  }
}

checkStore();
