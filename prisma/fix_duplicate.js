const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Since the Prisma schema has project_name as FK to projects.project_name,
// and we need to update projects.project_name (which has a unique constraint now)
// but there's a FK chain preventing updates...
// Let's remove the FK from inspections_summary, update project_name, re-add FK

async function fix() {
  // Step 1: Remove FK constraint by recreating table without it
  console.log('Creating temp table without FK...');
  await p.$executeRawUnsafe(`
    CREATE TABLE "inspections_summary_temp" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "project_name" TEXT,
      "employee_no" TEXT,
      "coordinator_name" TEXT,
      "vendor_location" TEXT,
      "inspection_start_date" TEXT,
      "inspection_end_date" TEXT,
      "report_no" TEXT,
      "work_duration" REAL,
      "ot_duration" REAL,
      "duration_tag" TEXT DEFAULT 'Hrs.',
      "travel_routing" TEXT,
      "mileage" REAL,
      "expenses_amount" REAL,
      "ts_filename" TEXT,
      "ts_file_verified" INTEGER DEFAULT 0,
      "created_at" TEXT,
      "updated_at" TEXT
    )
  `);

  console.log('Copying data...');
  await p.$executeRawUnsafe(`
    INSERT INTO "inspections_summary_temp" SELECT * FROM "inspections_summary"
  `);

  console.log('Dropping old table...');
  await p.$executeRawUnsafe(`DROP TABLE "inspections_summary"`);

  console.log('Renaming...');
  await p.$executeRawUnsafe(`ALTER TABLE "inspections_summary_temp" RENAME TO "inspections_summary"`);

  console.log('FK removed from DB layer. Now Prisma schema still has the FK but DB does not.');

  // Step 2: Now update the duplicate project name
  console.log('\nUpdating duplicate project name...');
  await p.$executeRawUnsafe(`UPDATE projects SET project_name = 'NFPS COMPRESSION1&3 (2)' WHERE id = '76ad1335-c9ab-40b9-9d36-ee2c80023b2b'`);
  console.log('Done!');

  // Verify
  const rows = await p.$queryRaw`SELECT id, project_name FROM projects WHERE id = '76ad1335-c9ab-40b9-9d36-ee2c80023b2b'`;
  console.log('Updated row:', JSON.stringify(rows));

  const allDupes = await p.$queryRaw`SELECT id, project_name FROM projects WHERE project_name LIKE 'NFPS COMPRESSION%'`;
  console.log('\nAll NFPS projects:');
  allDupes.forEach(r => console.log('  ' + r.project_name));

  await p.$disconnect();
}

fix().catch(e => { console.error('Error:', e.message); process.exit(1); });