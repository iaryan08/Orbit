import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.POSTGRES_URL_NON_POOLING;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Read SQL file
        const sql = fs.readFileSync('scripts/create_milestones_table.sql', 'utf8');

        console.log('Creating milestones table...');
        await client.query(sql);

        // Also notify pgrst to reload schema just in case
        console.log('Reloading schema...');
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Migration complete!');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
