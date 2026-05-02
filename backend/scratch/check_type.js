import { supabaseAdmin } from '../src/config/supabase.js';

async function test() {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rider_id'" 
    });
    
    if (error) {
        console.log('RPC failed (as expected if exec_sql not defined):', error.message);
        // Fallback: try to just fetch a row and check the type of rider_id value
        const { data: row } = await supabaseAdmin.from('orders').select('rider_id').not('rider_id', 'is', null).limit(1).single();
        if (row) {
            console.log('Sample rider_id:', row.rider_id, 'Type:', typeof row.rider_id);
        }
    } else {
        console.log('Column info:', data);
    }
}

test();
