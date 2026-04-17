const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  // Check existing FK constraints on inspections_summary
  const fks = await prisma.$queryRaw`PRAGMA foreign_key_list(inspections_summary)`;
  console.log('Foreign keys on inspections_summary:', fks.length > 0 ? fks : 'none');

  // Check all columns
  const cols = await prisma.$queryRaw`PRAGMA table_info(inspections_summary)`;
  console.log('\nColumns:', cols.map(c => c.name));

  await prisma.$disconnect();
}

check().catch(console.error);