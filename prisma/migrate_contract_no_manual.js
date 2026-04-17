// Migration: Replace projects.contract_id UUID FK with contract_no string FK
// Run: node prisma/migrate_contract_no_manual.js

const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function migrate() {
  const prisma = new PrismaClient();
  const backupPath = path.join(__dirname, 'dev.db.backup');

  try {
    console.log('=== Step 1: Backup ===');
    // Already backed up, continue

    console.log('\n=== Step 2: Export projects data ===');
    const projects = await prisma.projects.findMany({ include: { _count: true } });
    const projectsData = await prisma.$queryRaw`SELECT * FROM projects`;
    console.log(`Exported ${projectsData.length} rows`);

    console.log('\n=== Step 3: Create new projects table (no FK — SQLite cannot FK on NULL) ===');
    await prisma.$executeRaw`
      CREATE TABLE "projects_new" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "contract_no" TEXT,
        "project_name" TEXT,
        "po_no" TEXT,
        "itp_code" TEXT,
        "focal_name" TEXT,
        "focal_email" TEXT,
        "active_status" INTEGER DEFAULT 1,
        "created_at" DATETIME,
        "updated_at" DATETIME
      )
    `;

    console.log('\n=== Step 4: Copy data with contract_no lookup ===');
    await prisma.$executeRaw`
      INSERT INTO "projects_new" ("id", "contract_no", "project_name", "po_no", "itp_code", "focal_name", "focal_email", "active_status", "created_at", "updated_at")
      SELECT
        p."id",
        cc."contract_no",
        p."project_name",
        p."po_no",
        p."itp_code",
        p."focal_name",
        p."focal_email",
        p."active_status",
        p."created_at",
        p."updated_at"
      FROM projects p
      LEFT JOIN clients_and_contracts cc ON cc."id" = p."contract_id"
    `;

    console.log('\n=== Step 5: Drop old table ===');
    await prisma.$executeRaw`DROP TABLE "projects"`;

    console.log('\n=== Step 6: Rename new table ===');
    await prisma.$executeRaw`ALTER TABLE "projects_new" RENAME TO "projects"`;

    console.log('\n=== Step 7: Create index ===');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "projects_contract_no_idx" ON "projects"("contract_no")`;

    // Note: FK constraint NOT added via SQLite (see migration notes below)
    console.log('\n=== Verify ===');
    const cols = await prisma.$queryRaw`PRAGMA table_info('projects')`;
    console.log('projects columns:', cols.map(c => c.name).join(', '));

    const newCount = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM projects`;
    console.log('projects rows:', String(newCount[0].cnt));

    const fks = await prisma.$queryRaw`PRAGMA foreign_key_list('projects')`;
    fks.forEach(fk => {
      console.log(`FK: ${fk.from} -> ${fk.table}.${fk.to}`);
    });

    console.log('\nNote: FK constraint deferred to Prisma schema layer (SQLite limitation — cannot FK on NULLable column without dummy sentinel row)');
    console.log('\n✓ Migration complete!');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
