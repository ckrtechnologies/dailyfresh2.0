import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://db.dailyfreshkolkata.in';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role')
    .or('role.eq.admin,role.eq.store_manager');

  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }

  console.log('--- Authorized Users ---');
  data.forEach(user => {
    console.log(`Email: ${user.email} | Role: ${user.role}`);
  });
}

checkAdmins();
