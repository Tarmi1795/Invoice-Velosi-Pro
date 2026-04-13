export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [clientsCount, activeProjects, pendingInvoices, revenueAggr, recentInvoices] = await Promise.all([
      prisma.clients_and_contracts.count(),
      prisma.projects.count({ where: { active_status: true } }),
      prisma.proformas_and_invoices.count({ where: { payment_status: 'Pending' } }),
      prisma.proformas_and_invoices.aggregate({
        _sum: { total_amount: true },
        where: { payment_status: 'Paid' }
      }),
      prisma.proformas_and_invoices.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          inspections_summary: {
            include: {
              projects: {
                include: {
                  clients_and_contracts: true
                }
              }
            }
          }
        }
      })
    ]);
    
    const totalRevenue = Number(revenueAggr._sum.total_amount) || 0;

    const formattedRecentInvoices = recentInvoices.map(inv => ({
      id: inv.id,
      invoice_no: inv.invoice_no || inv.proforma_inv_no || 'N/A',
      client: inv.inspections_summary?.projects?.clients_and_contracts?.client_name || 'Generic',
      amount: Number(inv.total_amount) || 0,
      status: inv.payment_status || 'Pending',
      date: inv.invoice_date || inv.proforma_inv_date,
    }));

    return NextResponse.json({
      stats: {
        clientsCount,
        activeProjects,
        pendingInvoices,
        totalRevenue
      },
      recentInvoices: formattedRecentInvoices
    });
  } catch (error) {
    console.error("Dashboard api error", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
