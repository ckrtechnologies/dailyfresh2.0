const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    const migrationPath = path.join(__dirname, '../supabase/migrations/2026-04-27_fix_numeric_overflow.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration to fix numeric overflow...');
    
    // Split by semicolon and run each statement
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
            // Fallback: If exec_sql RPC doesn't exist, we might need another way.
            // But usually, I can't run raw SQL via supabase-js without an RPC.
            console.error('Error executing statement:', error);
            console.log('TIP: You may need to run this SQL manually in the Supabase Dashboard SQL Editor.');
            return;
        }
    }

    console.log('Migration completed successfully!');
}

runMigration();
