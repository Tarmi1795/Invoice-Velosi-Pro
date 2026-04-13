const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    // Connect to default DB to create the new one
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'postgres',
        port: 54322,
    });
    
    await client.connect();
    
    try {
        await client.query('CREATE DATABASE invoice_velosi_pro');
        console.log('Database invoice_velosi_pro created.');
    } catch (err) {
        if (err.code === '42P04') {
            console.log('Database already exists, skipping creation.');
        } else {
            throw err;
        }
    } finally {
        await client.end();
    }

    // Connect to the new DB and run schema
    const targetClient = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'invoice_velosi_pro',
        password: 'postgres',
        port: 54322,
    });

    await targetClient.connect();

    try {
        const schemaPath = path.join(__dirname, 'unified_invoice_schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await targetClient.query(sql);
        console.log('Schema executed successfully.');
    } catch (err) {
        console.error('Failed to execute schema:', err);
    } finally {
        await targetClient.end();
    }
}

main().catch(console.error);
