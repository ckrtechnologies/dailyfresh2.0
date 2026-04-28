import { supabaseAdmin } from '../src/config/supabase.js';

async function checkStatusConstraint() {
  console.log('--- Finding CHECK Constraints for orders ---');
  
  const query = `
    SELECT 
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
    FROM 
        pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE 
        contype = 'c' 
        AND conrelid = 'public.orders'::regclass;
  `;

  const { data, error } = await supabaseAdmin.rpc('execute_sql', { query_text: query });
  
  if (error) {
    console.error('Error fetching constraints:', error.message);
  } else {
    console.log('Found constraints:');
    console.table(data);
  }

  process.exit(0);
}

checkStatusConstraint();
