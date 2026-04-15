export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const clientIds = url.searchParams.get("clientIds");

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

    const invoices = await prisma.proformas_and_invoices.findMany({
      where: {
        OR: [
          { invoice_date: { gte: fromDate, lte: toDate } },
          { proforma_inv_date: { gte: fromDate, lte: toDate } },
        ],
      },
      include: {
        inspections_summary: {
          include: {
            projects: {
              include: {
                clients_and_contracts: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    let filteredInvoices = invoices;
    if (clientFilter && clientFilter.length > 0) {
      filteredInvoices = invoices.filter(inv => {
        const clientId = inv.inspections_summary?.projects?.clients_and_contracts?.id;
        return clientId && clientFilter.includes(clientId);
      });
    }

    const exportData = filteredInvoices.map(inv => {
      const client = inv.inspections_summary?.projects?.clients_and_contracts;
      const project = inv.inspections_summary?.projects;

      return {
        id: inv.id,
        proforma_inv_no: inv.proforma_inv_no || "",
        proforma_inv_date: inv.proforma_inv_date ? new Date(inv.proforma_inv_date).toLocaleDateString() : "",
        invoice_no: inv.invoice_no || inv.proforma_inv_no || "",
        invoice_date: inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "",
        sap_sales_order: inv.sap_sales_order || "",
        total_amount: inv.total_amount || 0,
        currency: client?.currency || "QAR",
        credit_memo_no: inv.credit_memo_no || "",
        credit_memo_amount: inv.credit_memo_amount || 0,
        conso_invoice_no: inv.conso_invoice_no || "",
        payment_status: inv.payment_status || "Pending",
        client_name: client?.client_name || "",
        project_name: project?.project_name || "",
        created_at: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "",
      };
    });

    return NextResponse.json({
      data: exportData,
      total: exportData.length,
      filters: { dateFrom, dateTo, clientIds: clientFilter || [] },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}