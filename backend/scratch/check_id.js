import { supabaseAdmin } from '../src/config/supabase.js';

async function test() {
    const id = 'c0674ede-6973-404c-8e2f-c520f320aa76';
    
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', id).single();
    console.log('Exists in profiles:', !!profile);
    
    const { data: rider } = await supabaseAdmin.from('riders').select('id').eq('id', id).single();
    console.log('Exists in riders:', !!rider);
}

test();
