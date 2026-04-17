const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('prisma/dev.db');

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

async function addFks() {
  try {
    // Add FK for project_name
    console.log('Adding project_name FK...');
    await run(`ALTER TABLE "inspections_summary" ADD CONSTRAINT "fk_project_name" FOREIGN KEY ("project_name") REFERENCES "projects" ("project_name") ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log('  OK');

    // Add FK for employee_no
    console.log('Adding employee_no FK...');
    await run(`ALTER TABLE "inspections_summary" ADD CONSTRAINT "fk_employee_no" FOREIGN KEY ("employee_no") REFERENCES "inspectors" ("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log('  OK');

    // Verify
    db.all(`PRAGMA foreign_key_list(inspections_summary)`, (err, fks) => {
      if (err) { console.error(err); db.close(); return; }
      console.log('\nFK constraints:', JSON.stringify(fks.map(f=>({from:f.from,to:f.to,table:f.table})), null, 2));
      db.close();
    });
  } catch(e) {
    console.error('Error:', e.message);
    db.close();
  }
}

addFks();