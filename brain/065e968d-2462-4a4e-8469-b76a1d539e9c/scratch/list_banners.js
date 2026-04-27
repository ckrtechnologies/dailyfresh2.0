
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('id, title, display_order')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    return;
  }

  console.log('--- Current Banners ---');
  data.forEach((b, i) => {
    console.log(`${i + 1}. ID: ${b.id} | Title: ${b.title} | Order: ${b.display_order}`);
  });
}

listBanners();
