import { supabaseAdmin } from '../src/config/supabase.js';

async function testFiltering() {
  const store_id = '72134493-2947-4977-9475-4078864d47c4'; // Example store ID from your DB
  const delivery_type = 'express';

  console.log('--- Testing Product List Filtering ---');
  const { data: products, error: pError } = await supabaseAdmin
    .from('products')
    .select('id, name, delivery_options')
    .eq('is_active', true)
    .eq('store_id', store_id)
    .contains('delivery_options', JSON.stringify([delivery_type]))
    .limit(5);

  if (pError) console.error('Product Filter Error:', pError);
  else console.log('Products found:', products?.length);

  console.log('\n--- Testing Category Hierarchy Filtering ---');
  // This is the one I suspect is failing due to nested path syntax
  const { data: categories, error: cError } = await supabaseAdmin
    .from('categories')
    .select(`
      *,
      sub_categories!inner(
        id,
        products!inner(id, delivery_options)
      )
    `)
    .eq('is_active', true)
    .eq('sub_categories.is_active', true)
    .eq('sub_categories.products.is_active', true)
    .eq('sub_categories.products.store_id', store_id)
    .contains('sub_categories.products.delivery_options', JSON.stringify([delivery_type]));

  if (cError) console.error('Category Filter Error:', cError);
  else console.log('Categories found:', categories?.length);
}

testFiltering();
