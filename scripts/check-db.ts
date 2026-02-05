import { createAdminClient } from '../lib/supabase/server';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env or .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });


async function runMigration() {
    try {
        console.log('Starting migration...');
        const supabase = await createAdminClient();

        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20240205_create_push_subscriptions.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing SQL...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist (it usually doesn't by default), we'll try a different approach
            console.warn('RPC exec_sql failed, trying direct table creation check...');

            // Try a simple query to see if we can at least check if table exists
            const { error: tableError } = await supabase.from('push_subscriptions').select('id').limit(1);

            if (tableError && tableError.code === '42P01') { // Table doesn't exist
                console.error('Table push_subscriptions does not exist. Please run the migration SQL in your Supabase SQL Editor:');
                console.log('\n' + sql + '\n');
            } else if (!tableError) {
                console.log('Table already exists.');
            } else {
                console.error('Database error:', tableError);
            }
        } else {
            console.log('Migration completed successfully.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
