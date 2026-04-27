
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://db.dailyfreshkolkata.in';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRoles() {
  const { data, error } = await supabase.from('profiles').select('role').limit(50);
  if (error) {
    console.error('Error fetching roles:', error.message);
    return;
  }
  const uniqueRoles = [...new Set(data.map(r => r.role))];
  console.log('--- Current Roles in DB ---');
  console.log(uniqueRoles);
}

checkRoles();
