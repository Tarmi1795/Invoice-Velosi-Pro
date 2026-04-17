const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function backfill() {
  // Backfill employee_no from inspectors.id -> inspectors.employee_no
  console.log('Backfilling employee_no...');
  await p.$executeRawUnsafe(`
    UPDATE "inspections_summary"
    SET "employee_no" = (
      SELECT "employee_no" FROM "inspectors"
      WHERE "inspectors"."id" = "inspections_summary"."employee_no"
    )
    WHERE "employee_no" IS NOT NULL
  `);
  console.log('  Done');

  // Backfill project_name from projects.id -> projects.project_name
  console.log('Backfilling project_name...');
  await p.$executeRawUnsafe(`
    UPDATE "inspections_summary"
    SET "project_name" = (
      SELECT "project_name" FROM "projects"
      WHERE "projects"."id" = "inspections_summary"."project_name"
    )
    WHERE "project_name" IS NOT NULL
  `);
  console.log('  Done');

  // Verify
  const sample = await p.$queryRaw`SELECT id, project_name, employee_no FROM "inspections_summary" LIMIT 5`;
  console.log('\nSample data:');
  sample.forEach(r => console.log('  ' + r.id + ' | ' + r.project_name + ' | ' + r.employee_no));

  await p.$disconnect();
}

backfill().catch(e => { console.error(e.message); process.exit(1); });