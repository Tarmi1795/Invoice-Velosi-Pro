const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrate() {
  // Read the SQL migration file
  const sql = fs.readFileSync('./prisma/migrate_inspections_fk.sql', 'utf8');

  // Execute using Prisma's raw query
  // Split by semicolons and execute each statement
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    if (stmt.startsWith('--')) continue; // skip comments
    console.log('Executing:', stmt.substring(0, 60) + '...');
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('  OK');
    } catch (err) {
      console.error('  ERROR:', err.message);
    }
  }

  // Verify result
  const cols = await prisma.$queryRaw`PRAGMA table_info(inspections_summary)`;
  console.log('\nFinal columns:', cols.map(c => c.name));

  await prisma.$disconnect();
}

migrate().catch(console.error);