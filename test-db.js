const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== INVOICES DIRECT FROM DB ===');
  const invoices = await p.proformas_and_invoices.findMany();
  console.log(JSON.stringify(invoices, null, 2));
  
  console.log('\n=== API RESPONSE TEST ===');
  const response = await fetch('http://localhost:3004/api/invoices');
  const data = await response.json();
  console.log('API returned:', Array.isArray(data) ? data.length : 'error', 'items');
  console.log(JSON.stringify(data, null, 2));
  
  await p.$disconnect();
}

main().catch(console.error);