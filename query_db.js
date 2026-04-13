const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== DATABASE CONTENTS ===\n');
  
  const contracts = await p.clients_and_contracts.findMany();
  console.log('CONTRACTS (', contracts.length, '):');
  contracts.forEach(c => console.log(' -', c.id, c.client_name, c.contract_no));
  
  const invoices = await p.proformas_and_invoices.findMany();
  console.log('\nINVOICES (', invoices.length, '):');
  invoices.forEach(i => console.log(' -', i.id, i.invoice_no || i.proforma_inv_no, 'amount:', i.total_amount, 'status:', i.payment_status));
  
  const inspections = await p.inspections_summary.findMany();
  console.log('\nINSPECTIONS (', inspections.length, '):');
  inspections.forEach(i => console.log(' -', i.id, i.report_no, 'project:', i.project_id));
  
  await p.$disconnect();
}

main().catch(console.error);