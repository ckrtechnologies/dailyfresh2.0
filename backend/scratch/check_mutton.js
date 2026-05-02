import { supabaseAdmin } from '../src/config/supabase.js';

async function checkProduct() {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('name, delivery_options, scheduled_stock_qty, express_stock_qty, is_active, store_id')
    .ilike('name', '%Mutton Curry Cut%')
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return;
  }

  console.log('Product Found:', product.name);
  console.log('Delivery Options:', JSON.stringify(product.delivery_options));
  console.log('Scheduled Stock:', product.scheduled_stock_qty);
  console.log('Express Stock:', product.express_stock_qty);
  console.log('Active:', product.is_active);
  console.log('Store ID:', product.store_id);
}

checkProduct();
