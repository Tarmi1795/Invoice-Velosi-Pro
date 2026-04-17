const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('Step 1: Create new table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "inspections_summary_new" (
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
  console.log('  OK');

  console.log('Step 2: Copy data with JOINs...');
  await prisma.$executeRawUnsafe(`
    INSERT INTO "inspections_summary_new" (
      "id", "project_name", "employee_no", "coordinator_name", "vendor_location",
      "inspection_start_date", "inspection_end_date", "report_no",
      "work_duration", "ot_duration", "duration_tag", "travel_routing",
      "mileage", "expenses_amount", "ts_filename", "ts_file_verified",
      "created_at", "updated_at"
    )
    SELECT
      i."id",
      p."project_name",
      ins."employee_no",
      i."coordinator_name",
      i."vendor_location",
      i."inspection_start_date",
      i."inspection_end_date",
      i."report_no",
      i."work_duration",
      i."ot_duration",
      i."duration_tag",
      i."travel_routing",
      i."mileage",
      i."expenses_amount",
      i."ts_filename",
      i."ts_file_verified",
      i."created_at",
      i."updated_at"
    FROM "inspections_summary" i
    LEFT JOIN "projects" p ON p."id" = i."project_id"
    LEFT JOIN "inspectors" ins ON ins."id" = i."inspector_id"
  `);
  console.log('  OK');

  console.log('Step 3: Drop old table...');
  await prisma.$executeRawUnsafe(`DROP TABLE "inspections_summary"`);
  console.log('  OK');

  console.log('Step 4: Rename new table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "inspections_summary_new" RENAME TO "inspections_summary"`);
  console.log('  OK');

  // Verify
  const cols = await prisma.$queryRaw`PRAGMA table_info(inspections_summary)`;
  console.log('\nFinal columns:', cols.map(c => c.name));

  const fks = await prisma.$queryRaw`PRAGMA foreign_key_list(inspections_summary)`;
  console.log('FK constraints:', fks.length > 0 ? fks : 'none');

  // Check sample data
  const sample = await prisma.$queryRaw`SELECT id, project_name, employee_no FROM "inspections_summary" LIMIT 5`;
  console.log('\nSample data (id, project_name, employee_no):');
  sample.forEach(r => console.log(`  ${r.id} | ${r.project_name} | ${r.employee_no}`));

  await prisma.$disconnect();
}

migrate().catch(console.error);