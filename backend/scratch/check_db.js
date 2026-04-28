import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { data: products } = await supabase.from('products').select('id').limit(1);
  if (!products || products.length === 0) {
    console.log('No products found to test with.');
    return;
  }

  const productId = products[0].id;
  console.log('Testing insert for product:', productId);

  const { data, error } = await supabase.from('product_variants').insert({
    product_id: productId,
    name: 'Test Variant ' + new Date().getTime(),
    price: 99
  }).select();

  if (error) {
    console.log('Insert FAILED:', error);
  } else {
    console.log('Insert SUCCESS:', data);
    // Cleanup
    await supabase.from('product_variants').delete().eq('id', data[0].id);
  }
}

testInsert();
