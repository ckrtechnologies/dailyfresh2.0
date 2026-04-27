import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/dev/dailyfresh/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .ilike('full_name', '%Chandan%');
    
    console.log('Users matching Chandan:');
    console.table(users);

    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, user_id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
    
    console.log('Latest 30 notifications:');
    console.table(notifications.map(n => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        created_at: n.created_at
    })));
}

checkUsers();
