import { supabaseAdmin } from '../src/config/supabase.js';

async function test() {
    const { data, error } = await supabaseAdmin.from('orders').select('rider_id').limit(1);
    if (error) {
        console.error('Error fetching rider_id:', error);
    } else {
        console.log('Successfully fetched rider_id:', data);
    }
}

test();
