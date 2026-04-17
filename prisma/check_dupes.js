const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Check what inspections reference the duplicate projects
p.$queryRaw`SELECT i.id, i.project_id, p.project_name, p.id as proj_id
  FROM inspections_summary i
  JOIN projects p ON p.id = i.project_id
  WHERE p.project_name = 'NFPS COMPRESSION1&3'`
  .then(rows => {
    console.log('Inspections for NFPS COMPRESSION1&3:', rows.length);
    rows.forEach(r => console.log('  inspection', r.id, '-> project', r.proj_id));
    p.$disconnect();
  })
  .catch(e => { console.error(e.message); p.$disconnect(); });