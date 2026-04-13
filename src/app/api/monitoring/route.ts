export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const projects = await prisma.projects.findMany({
      include: {
        inspections_summary: {
          include: {
            proformas_and_invoices: true
          }
        }
      }
    });

    const monitoringData = projects.map(project => {
      let totalInvoiced = 0;
      project.inspections_summary.forEach(inspection => {
        inspection.proformas_and_invoices.forEach(invoice => {
          // Use total_amount as the value
          totalInvoiced += (Number(invoice.total_amount) || 0);
        });
      });

      const budget = Number(project.budget) || 0;
      const runningBalance = budget - totalInvoiced;

      return {
        id: project.id,
        project_name: project.project_name,
        po_no: project.po_no,
        itp_code: project.itp_code,
        budget: budget,
        total_invoiced: totalInvoiced,
        running_balance: runningBalance,
        status: runningBalance < 0 ? 'Over Budget' : (runningBalance < (budget * 0.1) ? 'Low Budget' : 'Healthy')
      };
    });

    return NextResponse.json(monitoringData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch monitoring data" }, { status: 500 });
  }
}
