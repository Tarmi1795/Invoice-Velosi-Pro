const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Inserting sample data...');
  const client = await prisma.clients_and_contracts.create({
    data: {
      client_name: 'Test Client',
      contract_no: 'C-001',
      original_contract_value: 100000,
      currency: 'QAR'
    }
  });

  const project = await prisma.projects.create({
    data: {
      project_name: 'Test Project',
      contract_id: client.id,
      po_no: 'PO-123'
    }
  });

  const inspector = await prisma.inspectors.create({
    data: {
      full_name: 'John Doe',
      job_title: 'Surveyor'
    }
  });

  console.log('Success! Created IDs:', { client: client.id, project: project.id, inspector: inspector.inspector_id });
}

main().catch(e => {
  console.error('FAILED TO INSERT:', e);
  process.exit(1);
});
