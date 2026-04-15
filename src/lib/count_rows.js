const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../prisma/dev.db');
console.error("Opening:", dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) { console.error("Open error:", err.message); process.exit(1); }
});

const tables = ['inspectors', 'projects', 'inspections_summary', 'proformas_and_invoices', 'ses_records', 'clients_and_contracts'];

let done = 0;
const results = {};

tables.forEach(table => {
  db.get(`SELECT COUNT(*) as cnt FROM ${table}`, [], (e, r) => {
    if (e) { console.error(`Error counting ${table}:`, e.message); }
    else { results[table] = r.cnt; }
    done++;
    if (done === tables.length) {
      console.log(JSON.stringify(results, null, 2));
      db.close();
    }
  });
});
