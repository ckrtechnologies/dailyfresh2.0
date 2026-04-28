import { supabaseAdmin } from '../src/config/supabase.js';

async function checkSchema() {
  console.log('--- Checking Database Schema ---');
  
  // 1. Check if order_tracking exists
  const { data: tables, error: tableError } = await supabaseAdmin
    .from('order_tracking')
    .select('*')
    .limit(1);
    
  if (tableError) {
    console.error('❌ order_tracking table MISSING or inaccessible:', tableError.message);
  } else {
    console.log('✅ order_tracking table exists.');
  }

  // 2. Check orders columns
  const { data: orderCols, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .limit(1);
    
  if (orderErr) {
    console.error('❌ Error fetching orders:', orderErr.message);
  } else {
    console.log('✅ orders table reachable. Sample:', orderCols[0] ? 'Data present' : 'Empty');
  }

  process.exit(0);
}

checkSchema();
