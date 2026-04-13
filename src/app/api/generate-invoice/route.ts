export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

function formatDate(d: any): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

function formatNumber(n: any): string {
  if (n === null || n === undefined) return "0.00";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    const templateOverride = searchParams.get("template");

    if (!invoiceId) {
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
    }

    // 1. Fetch the full data chain
    const invoice = await prisma.proformas_and_invoices.findUnique({
      where: { id: invoiceId },
      include: {
        inspections_summary: {
          include: {
            inspectors: true,
            projects: {
              include: {
                clients_and_contracts: {
                  include: { workflow_presets: true }
                }
              }
            }
          }
        },
        ses_records: {
          orderBy: { created_at: "desc" },
          take: 1,
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const inspection = invoice.inspections_summary;
    const inspector = inspection?.inspectors;
    const project = inspection?.projects;
    const client = project?.clients_and_contracts;
    const preset = client?.workflow_presets;
    const ses = invoice.ses_records?.[0];

    // 2. Determine which template to use
    const templateName = templateOverride || preset?.invoice_template || "invoice_standard.html";
    const templatePath = path.join(process.cwd(), "templates", templateName);
    const stylesPath = path.join(process.cwd(), "templates", "shared", "styles.css");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template '${templateName}' not found` }, { status: 404 });
    }

    let html = fs.readFileSync(templatePath, "utf-8");
    const styles = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, "utf-8") : "";

    // 3. Build the variables object
    const vars: Record<string, string> = {
      // Client
      client_name: client?.client_name || "—",
      contract_no: client?.contract_no || "—",
      currency: client?.currency || "QAR",
      // Project
      project_name: project?.project_name || "—",
      po_no: project?.po_no || "—",
      itp_code: project?.itp_code || "—",
      // Inspector
      inspector_name: inspector?.full_name || "—",
      job_title: inspector?.job_title || "—",
      base_location: inspector?.base_location || "—",
      // Inspection
      report_no: inspection?.report_no || "—",
      coordinator_name: inspection?.coordinator_name || "—",
      vendor_location: inspection?.vendor_location || "—",
      inspection_start: formatDate(inspection?.inspection_start_date),
      inspection_end: formatDate(inspection?.inspection_end_date),
      work_duration: String(inspection?.work_duration || 0),
      ot_duration: String(inspection?.ot_duration || 0),
      duration_tag: inspection?.duration_tag || "Hrs.",
      travel_routing: inspection?.travel_routing || "—",
      mileage: String(inspection?.mileage || 0),
      expenses_amount: formatNumber(inspection?.expenses_amount),
      ts_filename: inspection?.ts_filename || "—",
      // Invoice
      proforma_inv_no: invoice.proforma_inv_no || "—",
      proforma_inv_date: formatDate(invoice.proforma_inv_date),
      sap_sales_order: invoice.sap_sales_order || "—",
      invoice_no: invoice.invoice_no || invoice.proforma_inv_no || "—",
      invoice_date: formatDate(invoice.invoice_date || invoice.proforma_inv_date),
      conso_invoice_no: invoice.conso_invoice_no || "—",
      total_amount: formatNumber(invoice.total_amount),
      credit_memo_no: invoice.credit_memo_no || "—",
      credit_memo_amount: formatNumber(invoice.credit_memo_amount),
      payment_status: invoice.payment_status || "Pending",
      // SES
      ses_no: ses?.ses_no || "—",
      ses_date: formatDate(ses?.ses_date),
      ses_value: formatNumber(ses?.ses_value),
      sap_work_order: ses?.sap_work_order || "—",
      // Meta
      today_date: formatDate(new Date()),
      generated_by: "Invoice Velosi Pro",
      // Preset Static Info
      company_address: preset?.company_address || "P.O. Box 24512, Doha, Qatar",
      company_contact: preset?.company_contact || "info@velosipro.com / +974 4444 0000",
      bank_details: preset?.bank_details || "Velosi Pro - QNB Account: 0000-0000-0000",
      // Styles
      styles: styles,
    };

    // 4. Replace all {{variable}} placeholders
    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });

    // 5. Inject Print Button
    html = html.replace("</body>", `
      <div class="print-helper no-print" onclick="window.print()">
        🖨️ Print to PDF
      </div>
    </body>`);

    // Return rendered HTML
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (error) {
    console.error("Generate invoice error:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
