import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/dev/dailyfresh/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotifications() {
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', '%Chandan%');
    
    if (userError) {
        console.error('Error fetching user:', userError);
        return;
    }

    console.log('Found Users:', users);

    for (const user of users) {
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (notifError) {
            console.error(`Error fetching notifications for ${user.full_name}:`, notifError);
        } else {
            console.log(`Recent notifications for ${user.full_name} (${user.id}):`);
            console.table(notifications.map(n => ({
                id: n.id,
                title: n.title,
                created_at: n.created_at,
                type: n.type
            })));
        }
    }
}

checkNotifications();
