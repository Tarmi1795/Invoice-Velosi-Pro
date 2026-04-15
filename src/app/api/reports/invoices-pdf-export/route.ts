export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

const PAGE_SIZE = 150;

const formatDate = (d: any): string => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
};

const formatNumber = (n: any): string => {
  if (n === null || n === undefined) return "0.00";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function generateInvoiceHtml(invoice: any, company: any, client: any, insp: any, ses: any): string {
  const tplPath = path.join(process.cwd(), "templates", "invoice_standard.html");
  const cssPath = path.join(process.cwd(), "templates", "shared", "styles.css");

  if (!fs.existsSync(tplPath)) return "<html><body><p>Template not found</p></body></html>";

  let html = fs.readFileSync(tplPath, "utf-8");
  const sharedCss = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf-8") : "";

  // Convert logo to base64 for PDF embedding
  let logoBase64 = "";
  const logoPath = path.join(process.cwd(), "public", "logos", "velosi_logo.png");
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }

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
    logo_url: logoBase64 || "/logos/velosi_logo.png",
    styles: sharedCss,
  };

  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => map[k] !== undefined ? map[k] : m);
  html = html.replace("</body>", `<style>body { margin: 20mm; }</style></body>`);
  return html;
}

export async function GET(request: Request) {
  let browser = null;
  try {
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const clientIds = url.searchParams.get("clientIds");
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 });
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    let clientFilter: string[] | undefined;
    if (clientIds) {
      clientFilter = clientIds.split(",").map(id => id.trim()).filter(Boolean);
    }

    const allInvoices = await prisma.proformas_and_invoices.findMany({
      where: {
        OR: [
          { invoice_date: { gte: fromDate, lte: toDate } },
          { proforma_inv_date: { gte: fromDate, lte: toDate } },
        ],
      },
      include: {
        inspections_summary: {
          include: {
            inspectors: true,
            projects: {
              include: {
                clients_and_contracts: {
                  include: { workflow_presets: { include: { company_profile: true } } },
                },
              },
            },
          },
        },
        ses_records: { orderBy: { created_at: "desc" }, take: 1 },
      },
      orderBy: { created_at: "desc" },
    });

    let filteredInvoices = allInvoices;
    if (clientFilter && clientFilter.length > 0) {
      filteredInvoices = allInvoices.filter(inv => {
        const clientId = inv.inspections_summary?.projects?.clients_and_contracts?.id;
        return clientId && clientFilter.includes(clientId);
      });
    }

    const totalInvoices = filteredInvoices.length;
    const totalPages = Math.ceil(totalInvoices / PAGE_SIZE);
    const startIdx = (page - 1) * PAGE_SIZE;
    const pageInvoices = filteredInvoices.slice(startIdx, startIdx + PAGE_SIZE);

    const zip = new JSZip();
    const defaultCompany = await prisma.company_profiles.findFirst({ orderBy: { created_at: "asc" } });

    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    for (const invoice of pageInvoices) {
      const insp = invoice.inspections_summary;
      const client = insp?.projects?.clients_and_contracts;
      const preset = client?.workflow_presets;
      const company = preset?.company_profile || defaultCompany;
      const ses = invoice.ses_records?.[0];

      const invoiceNo = invoice.invoice_no || invoice.proforma_inv_no || "unknown";
      const safeName = invoiceNo.replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${safeName}.pdf`;

      const html = generateInvoiceHtml(invoice, company, client, insp, ses);

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
      });

      zip.file(filename, pdfBuffer);
      await page.close();
    }

    await browser.close();
    browser = null;

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="invoices_${dateFrom}_to_${dateTo}_page_${page}.zip"`,
        "X-Total-Invoices": String(totalInvoices),
        "X-Total-Pages": String(totalPages),
        "X-Current-Page": String(page),
      },
    });
  } catch (e) {
    console.error("PDF Export error:", e);
    if (browser) await browser.close();
    return NextResponse.json({ error: "Export failed: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}