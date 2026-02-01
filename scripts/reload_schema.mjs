import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function reloadSchema() {
    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Notifying PostgREST to reload schema...');
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log('Done! Schema reload triggered.');
    } catch (err) {
        console.error('Error reloading schema:', err);
    } finally {
        await client.end();
    }
}

reloadSchema();
