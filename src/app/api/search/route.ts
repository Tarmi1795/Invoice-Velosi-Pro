export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SEARCH_QUERIES: Record<string, { model: string; fields: string[]; label: string; subFields: string[] }> = {
  invoices: {
    model: "proformas_and_invoices",
    fields: ["proforma_inv_no", "invoice_no", "po_no", "sr_so_no", "conso_invoice_no"],
    label: "mainText",
    subFields: ["total_amount", "payment_status"],
  },
  clients: {
    model: "clients_and_contracts",
    fields: ["client_name", "contract_no"],
    label: "client_name",
    subFields: ["currency"],
  },
  projects: {
    model: "projects",
    fields: ["project_name", "po_no", "itp_code"],
    label: "project_name",
    subFields: ["focal_name"],
  },
  ses: {
    model: "ses_records",
    fields: ["ses_no", "po_no", "itp_code", "sap_work_order"],
    label: "ses_no",
    subFields: ["ses_value", "status"],
  },
  inspections: {
    model: "inspections_summary",
    fields: ["report_no", "coordinator_name", "vendor_location"],
    label: "report_no",
    subFields: ["coordinator_name", "vendor_location"],
  },
  inspectors: {
    model: "inspectors",
    fields: ["full_name", "job_title", "base_location"],
    label: "full_name",
    subFields: ["job_title"],
  },
  po_records: {
    model: "po_records",
    fields: ["po_no", "client_name", "project_name"],
    label: "po_no",
    subFields: ["client_name", "status"],
  },
  service_orders: {
    model: "service_orders",
    fields: ["sr_so_no", "po_no", "client_name", "project_name"],
    label: "sr_so_no",
    subFields: ["client_name", "status"],
  },
};

export async function POST(request: Request) {
  try {
    const { query, entities } = await request.json();

    if (!query || query.length < 2 || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json({ results: {} });
    }

    const pattern = `%${query}%`;
    const results: Record<string, any[]> = {};

    for (const entity of entities) {
      const config = SEARCH_QUERIES[entity];
      if (!config) continue;

      const { model, fields, label, subFields } = config;
      const conditions = fields.map(() => `${fields[0]} LIKE ? COLLATE NOCASE`).join(" OR ");
      const selectFields = ["id", label, ...subFields, "created_at"].join(", ");

      try {
        const rawResults = await prisma.$queryRawUnsafe<any[]>(
          `SELECT ${selectFields} FROM ${model} WHERE ${conditions} LIMIT 20`,
          pattern, pattern, pattern, pattern, pattern
        );

        results[entity] = rawResults.map((row: any) => ({
          id: row.id,
          mainText: row[label] || "",
          subText: subFields.map((sf: string) => row[sf]).filter(Boolean).join(" • "),
          type: entity,
          created_at: row.created_at,
        }));
      } catch (err) {
        console.error(`Search error for ${entity}:`, err);
        results[entity] = [];
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
