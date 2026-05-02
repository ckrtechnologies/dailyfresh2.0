import { supabaseAdmin } from '../src/config/supabase.js';

async function checkUniqueOptions() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('delivery_options');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const allOptions = new Set();
  data.forEach(p => {
    if (p.delivery_options) {
      p.delivery_options.forEach(opt => allOptions.add(opt));
    }
  });

  console.log('Unique Delivery Options in DB:', Array.from(allOptions));
}

checkUniqueOptions();
