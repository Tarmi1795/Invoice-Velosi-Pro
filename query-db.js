const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List tables by counting records
  console.log('=== DATABASE TABLES ===\n');

  try {
    const clients = await prisma.clients_and_contracts.findMany();
    console.log(`📋 clients_and_contracts: ${clients.length} records`);
    if (clients.length > 0) {
      console.table(clients.map(c => ({
        id: c.id?.substring(0,8)+'...',
        client_name: c.client_name,
        contract_no: c.contract_no,
        currency: c.currency,
        original_contract_value: c.original_contract_value,
        running_balance: c.running_balance
      })));
    }
  } catch(e) { console.log('❌ clients_and_contracts:', e.message); }

  try {
    const projects = await prisma.projects.findMany();
    console.log(`\n📁 projects: ${projects.length} records`);
    if (projects.length > 0) {
      console.table(projects.map(p => ({
        id: p.id?.substring(0,8)+'...',
        project_name: p.project_name,
        po_no: p.po_no,
        contract_id: p.contract_id?.substring(0,8)+'...',
        active: p.active_status
      })));
    }
  } catch(e) { console.log('❌ projects:', e.message); }

  try {
    const inspectors = await prisma.inspectors.findMany();
    console.log(`\n👷 inspectors: ${inspectors.length} records`);
    if (inspectors.length > 0) {
      console.table(inspectors);
    }
  } catch(e) { console.log('❌ inspectors:', e.message); }

  try {
    const inspections = await prisma.inspections_summary.findMany();
    console.log(`\n🔍 inspections_summary: ${inspections.length} records`);
    if (inspections.length > 0) {
      console.table(inspections.map(i => ({
        id: i.id?.substring(0,8)+'...',
        report_no: i.report_no,
        vendor: i.vendor_location,
        start: i.inspection_start_date,
        duration: i.work_duration
      })));
    }
  } catch(e) { console.log('❌ inspections_summary:', e.message); }

  try {
    const invoices = await prisma.proformas_and_invoices.findMany();
    console.log(`\n🧾 proformas_and_invoices: ${invoices.length} records`);
    if (invoices.length > 0) {
      console.table(invoices.map(i => ({
        id: i.id?.substring(0,8)+'...',
        proforma: i.proforma_inv_no,
        invoice: i.invoice_no,
        amount: i.total_amount,
        status: i.payment_status,
        conso: i.conso_invoice_no
      })));
    }
  } catch(e) { console.log('❌ proformas_and_invoices:', e.message); }

  try {
    const ses = await prisma.ses_records.findMany();
    console.log(`\n📄 ses_records: ${ses.length} records`);
    if (ses.length > 0) {
      console.table(ses.map(s => ({
        id: s.id?.substring(0,8)+'...',
        ses_no: s.ses_no,
        value: s.ses_value,
        status: s.status,
        wo: s.sap_work_order
      })));
    }
  } catch(e) { console.log('❌ ses_records:', e.message); }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
