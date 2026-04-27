import { supabaseAdmin } from './src/config/supabase.js';

const checkDuplicateTokens = async () => {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, fcm_token')
    .not('fcm_token', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const tokenMap = {};
  profiles.forEach(p => {
    if (tokenMap[p.fcm_token]) {
      tokenMap[p.fcm_token].push(p);
    } else {
      tokenMap[p.fcm_token] = [p];
    }
  });

  console.log('--- DUPLICATE TOKENS ---');
  Object.keys(tokenMap).forEach(token => {
    if (tokenMap[token].length > 1) {
      console.log(`Token: ${token.substring(0, 20)}...`);
      tokenMap[token].forEach(p => {
        console.log(`  - User: ${p.full_name} (ID: ${p.id})`);
      });
    }
  });
};

checkDuplicateTokens();
