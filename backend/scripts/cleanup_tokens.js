import { supabaseAdmin } from './src/config/supabase.js';

const cleanupTokens = async () => {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, fcm_token, updated_at')
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

  for (const token of Object.keys(tokenMap)) {
    if (tokenMap[token].length > 1) {
      console.log(`Cleaning up token for ${tokenMap[token].length} users...`);
      // Keep the most recently updated one, null out the others
      const sorted = tokenMap[token].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const [latest, ...others] = sorted;
      
      console.log(`  Keeping for: ${latest.full_name} (${latest.id})`);
      
      for (const other of others) {
        console.log(`  Removing from: ${other.full_name} (${other.id})`);
        await supabaseAdmin
          .from('profiles')
          .update({ fcm_token: null })
          .eq('id', other.id);
      }
    }
  }
  console.log('Cleanup complete!');
};

cleanupTokens();
