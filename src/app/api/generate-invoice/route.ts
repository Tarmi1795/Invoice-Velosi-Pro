export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

const formatDate = (d: any): string => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
};

const formatNumber = (n: any): string => {
  if (n === null || n === undefined) return "0.00";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const invId = url.searchParams.get("invoice_id");
    const tplOverride = url.searchParams.get("template");
    const isPrint = url.searchParams.get("print") === "1";

    if (!invId) return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });

    const invoice = await prisma.proformas_and_invoices.findUnique({
      where: { id: invId },
      include: {
        inspections_summary: {
          include: {
            inspectors: true,
            projects: {
              include: {
                clients_and_contracts: {
                  include: { 
                    workflow_presets: {
                      include: { company_profile: true }
                    } 
                  }
                }
              }
            }
          }
        },
        ses_records: { orderBy: { created_at: "desc" }, take: 1 }
      }
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const insp = invoice.inspections_summary;
    const client = insp?.projects?.clients_and_contracts;
    const preset = client?.workflow_presets;
    let company = preset?.company_profile;

    if (!company) {
      company = await prisma.company_profiles.findFirst({ orderBy: { created_at: 'asc' } });
    }

    const ses = invoice.ses_records?.[0];
    const tplName = tplOverride || preset?.invoice_template || "invoice_standard.html";
    const tplPath = path.join(process.cwd(), "templates", tplName);
    const cssPath = path.join(process.cwd(), "templates", "shared", "styles.css");

    if (!fs.existsSync(tplPath)) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    let finalHtml = fs.readFileSync(tplPath, "utf-8");
    const sharedCss = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf-8") : "";

    const map: Record<string, string> = {
      client_name: client?.client_name || "—",
      contract_no: client?.contract_no || "—",
      currency: client?.currency || "QAR",
      project_name: insp?.projects?.project_name || "—",
      po_no: insp?.projects?.po_no || "—",
      itp_code: insp?.projects?.itp_code || "—",
      inspector_name: insp?.inspectors?.full_name || "—",
      job_title: insp?.inspectors?.job_title || "—",
      base_location: insp?.inspectors?.base_location || "—",
      report_no: insp?.report_no || "—",
      coordinator_name: insp?.coordinator_name || "—",
      vendor_location: insp?.vendor_location || "—",
      inspection_start: formatDate(insp?.inspection_start_date),
      inspection_end: formatDate(insp?.inspection_end_date),
      work_duration: String(insp?.work_duration || 0),
      ot_duration: String(insp?.ot_duration || 0),
      duration_tag: insp?.duration_tag || "Hrs.",
      travel_routing: insp?.travel_routing || "—",
      mileage: String(insp?.mileage || 0),
      expenses_amount: formatNumber(insp?.expenses_amount),
      ts_filename: insp?.ts_filename || "—",
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
      ses_no: ses?.ses_no || "—",
      ses_date: formatDate(ses?.ses_date),
      ses_value: formatNumber(ses?.ses_value),
      sap_work_order: ses?.sap_work_order || "—",
      today_date: formatDate(new Date()),
      generated_by: "Invoice Velosi Pro",
      company_name: company?.name || "APPLUS+ VELOSI",
      company_address: company?.address || "P.O. Box 24512, Doha, Qatar",
      company_contact: company?.contact || "info@velosipro.com / +974 4444 0000",
      bank_details: company?.bank_details || "Velosi Pro - QNB Account: 0000-0000-0000",
      logo_url: company?.logo_path ? `/logos/${path.basename(company.logo_path)}` : "/logos/velosi_logo.png",
      styles: sharedCss,
    };

    finalHtml = finalHtml.replace(/\{\{(\w+)\}\}/g, (m, k) => map[k] !== undefined ? map[k] : m);
    finalHtml = finalHtml.replace("</body>", `
      <div class="print-helper no-print" onclick="window.print()">🖨️ Print to PDF</div>
      ${isPrint ? '<script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>' : ''}
    </body>`);

    return new NextResponse(finalHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
