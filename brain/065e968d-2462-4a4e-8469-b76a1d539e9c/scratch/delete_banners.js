
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteDuplicates() {
  const idsToDelete = [
    'dc1e7bd4-c570-4881-980d-e3efb1884a4b',
    '871bcfce-cac8-46f1-9de7-f41a6599430b',
    '524e6ccf-aee5-4dfb-ba7a-6d9a0249ab07'
  ];

  console.log('--- Deleting Duplicate Banners ---');

  for (const id of idsToDelete) {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete banner ${id}:`, error);
    } else {
      console.log(`Successfully deleted banner ${id}`);
    }
  }

  console.log('Cleanup complete!');
}

deleteDuplicates();
