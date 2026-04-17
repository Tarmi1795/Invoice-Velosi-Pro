const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Check current columns and FKs
async function check() {
  const cols = await p.$queryRaw`PRAGMA table_info(inspections_summary)`;
  console.log('inspections_summary columns:', cols.map(c => c.name));

  const fks = await p.$queryRaw`PRAGMA foreign_key_list(inspections_summary)`;
  console.log('\nFK constraints:', JSON.stringify(fks.map(f=>({from:f.from,to:f.to,table:f.table})), null, 2));

  const colsP = await p.$queryRaw`PRAGMA table_info(projects)`;
  console.log('\nprojects columns:', colsP.map(c => c.name));

  const colsI = await p.$queryRaw`PRAGMA table_info(inspectors)`;
  console.log('\ninspectors columns:', colsI.map(c => c.name));

  await p.$disconnect();
}
check().catch(e => { console.error(e.message); process.exit(1); });