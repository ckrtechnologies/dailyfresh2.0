import { supabaseAdmin } from '../src/config/supabase.js';

async function checkData() {
  const pincode = '712258';
  
  // 1. Find store
  const { data: stores, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('id, name, pincode, serviceable_pincodes')
    .or(`pincode.eq.${pincode},serviceable_pincodes.cs.{${pincode}}`);
    
  if (storeError) {
    console.error('Store Error:', storeError);
    return;
  }
  
  console.log('Stores found for', pincode, ':', stores);
  
  if (stores.length > 0) {
    const storeId = stores[0].id;
    
    // 2. Check products for this store
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, name, delivery_options, scheduled_stock_qty, express_stock_qty, is_active')
      .eq('store_id', storeId);
      
    if (prodError) {
      console.error('Prod Error:', prodError);
      return;
    }
    
    console.log('Total products for store:', products.length);
    
    const activeProducts = products.filter(p => p.is_active);
    console.log('Active products:', activeProducts.length);
    
    const scheduledProducts = activeProducts.filter(p => 
      (p.delivery_options.includes('tomorrow_morning') || p.delivery_options.includes('tomorrow_evening')) &&
      p.scheduled_stock_qty > 0
    );
    
    console.log('Products with scheduled stock > 0 and tomorrow options:', scheduledProducts.length);
    if (scheduledProducts.length > 0) {
      console.log('Sample scheduled product:', scheduledProducts[0]);
    }
  }
}

checkData();
