const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'file:C:/Users/Admin/.openclaw/workspace/accountant/Invoice Velosi Pro/prisma/dev.db';

let prisma = null;

function getClient() {
  if (!prisma) {
    process.env.DATABASE_URL = DATABASE_URL;
    prisma = new PrismaClient();
  }
  return prisma;
}

function parseDateFields(data, dateFields = []) {
  const parsed = { ...data };
  for (const field of dateFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      parsed[field] = new Date(parsed[field]);
    }
  }
  return parsed;
}

// ===== INSPECTORS =====

async function getInspectors() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspectors.findMany({ orderBy: { full_name: 'asc' } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getInspectorById(id) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspectors.findUnique({ where: { id } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getInspectorByName(name) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspectors.findMany({
      where: { full_name: { contains: name } }
    });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createInspector(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data);
    const result = await client.inspectors.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== PROJECTS =====

async function getProjects() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.projects.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getProjectById(id) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.projects.findUnique({ where: { id } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createProject(data) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.projects.create({ data });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== INSPECTIONS =====

async function getInspections() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspections_summary.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getInspectionById(id) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspections_summary.findUnique({ where: { id } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createInspection(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data, ['inspection_start_date', 'inspection_end_date']);
    const result = await client.inspections_summary.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function linkInspectionToInspector(inspectionId, inspectorId) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.inspections_summary.update({
      where: { id: inspectionId },
      data: { inspector_id: inspectorId }
    });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== ITP/PO =====

async function getItpPos() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.itp_pos.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getItpPosByInspector(inspectorId) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.itp_pos.findMany({ where: { inspector_id: inspectorId } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createItpPo(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data, ['expiry_date']);
    const result = await client.itp_pos.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== SES RECORDS =====

async function getSesRecords() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.ses_records.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function getSesByProformaId(proformaInvId) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.ses_records.findMany({ where: { proforma_inv_id: proformaInvId } });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createSesRecord(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data, ['ses_date']);
    const result = await client.ses_records.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== PROFORMAS & INVOICES =====

async function getProformas() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.proformas_and_invoices.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createProforma(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data, ['proforma_inv_date', 'invoice_date']);
    const result = await client.proformas_and_invoices.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== CLIENTS & CONTRACTS =====

async function getClients() {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.clients_and_contracts.findMany();
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function createClient(data) {
  try {
    const client = getClient();
    await client.$connect();
    const parsed = parseDateFields(data, ['contract_start_date', 'contract_end_date']);
    const result = await client.clients_and_contracts.create({ data: parsed });
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

// ===== GENERIC / UTILITY =====

async function runRaw(sql, params = []) {
  try {
    const client = getClient();
    await client.$connect();
    const result = await client.$queryRawUnsafe(sql, ...params);
    await client.$disconnect();
    return { data: result };
  } catch (err) {
    return { error: err.message };
  }
}

async function close() {
  try {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = {
  getInspectors,
  getInspectorById,
  getInspectorByName,
  createInspector,
  getProjects,
  getProjectById,
  createProject,
  getInspections,
  getInspectionById,
  createInspection,
  linkInspectionToInspector,
  getItpPos,
  getItpPosByInspector,
  createItpPo,
  getSesRecords,
  getSesByProformaId,
  createSesRecord,
  getProformas,
  createProforma,
  getClients,
  createClient,
  runRaw,
  close
};
