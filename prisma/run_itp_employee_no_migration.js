const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration: itp_pos inspector_id -> employee_no\n');

  // Verify current state
  const itpPosCount = db.prepare('SELECT COUNT(*) as cnt FROM itp_pos').get().cnt;
  console.log(`Current itp_pos rows: ${itpPosCount}`);

  if (itpPosCount === 0) {
    console.log('itp_pos is empty - schema already updated, nothing to migrate.');
    console.log('\nVerification:');
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='itp_pos'").get();
    console.log('itp_pos schema:', schema.sql);
    db.close();
    await prisma.$disconnect();
    return;
  }

  // A. Backfill inspector_id with employee_no values
  console.log('\nStep A: Backfilling inspector_id with employee_no...');
  const updateStmt = db.prepare(`
    UPDATE "itp_pos"
    SET "inspector_id" = (
        SELECT "employee_no" FROM "inspectors"
        WHERE "inspectors"."id" = "itp_pos"."inspector_id"
    )
    WHERE "inspector_id" IS NOT NULL
  `);
  const result = updateStmt.run();
  console.log(`  Updated ${result.changes} rows`);

  // B. Verify no orphans
  console.log('\nStep B: Verifying no orphans...');
  const orphanStmt = db.prepare(`
    SELECT COUNT(*) as orphan_count FROM "itp_pos" ip
    WHERE ip."inspector_id" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "inspectors" i WHERE i."employee_no" = ip."inspector_id")
  `);
  const orphanResult = orphanStmt.get();
  console.log(`  Orphan count: ${orphanResult.orphan_count}`);
  if (orphanResult.orphan_count > 0) {
    console.error('ERROR: Orphans found! Stopping migration.');
    process.exit(1);
  }
  console.log('  No orphans - OK');

  // C. Recreate itp_pos with new FK (using temp table to avoid FK issues)
  console.log('\nStep C: Recreating itp_pos table with new FK...');

  // Disable FK to allow clean table recreation
  db.exec('PRAGMA foreign_keys=OFF');

  // Backup data to temp table
  db.exec('CREATE TABLE "itp_pos_temp" AS SELECT * FROM "itp_pos"');
  console.log('  Backup created');

  // Drop old table
  db.exec('DROP TABLE "itp_pos"');
  console.log('  Dropped old table');

  // Create new table with employee_no FK
  db.exec(`
    CREATE TABLE "itp_pos" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "project_id" TEXT,
        "itp_po_number" TEXT,
        "po_no" TEXT UNIQUE,
        "location" TEXT,
        "inspector_id" TEXT,
        "expiry_date" DATETIME,
        "designation" TEXT,
        "rates" REAL,
        "original_budget" REAL DEFAULT 0,
        "total_invoiced" REAL DEFAULT 0,
        "status" TEXT DEFAULT 'Active',
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("inspector_id") REFERENCES "inspectors" ("employee_no") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  console.log('  Created new table with employee_no FK');

  // Restore data
  db.exec('INSERT INTO "itp_pos" SELECT * FROM "itp_pos_temp"');
  console.log('  Data restored');

  // Drop temp table
  db.exec('DROP TABLE "itp_pos_temp"');

  // Re-enable FK
  db.exec('PRAGMA foreign_keys=ON');
  console.log('  FK re-enabled');

  // Verify
  console.log('\nVerification:');
  const sample = db.prepare('SELECT inspector_id FROM itp_pos LIMIT 5').all();
  console.log('  Sample itp_pos.inspector_id values (now employee_no strings):');
  sample.forEach(row => console.log(`    inspector_id="${row.inspector_id}"`));

  console.log('\nMigration complete!');
  await prisma.$disconnect();
  db.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});