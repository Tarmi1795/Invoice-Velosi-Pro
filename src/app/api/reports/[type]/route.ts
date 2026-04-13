export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;

    if (type === "budget-balances") {
      const clients = await prisma.clients_and_contracts.findMany({
        include: {
          projects: {
            include: {
              inspections_summary: {
                include: {
                  proformas_and_invoices: true
                }
              }
            }
          }
        }
      });

      const data = clients.map(c => {
        let total_invoiced = 0;
        c.projects.forEach(p => {
          p.inspections_summary.forEach(i => {
            i.proformas_and_invoices.forEach(inv => {
              total_invoiced += (Number(inv.total_amount) || 0);
            });
          });
        });

        const original = Number(c.original_contract_value) || 0;
        const pct_depleted = original > 0 ? (total_invoiced / original) * 100 : 0;
        const remaining = original - total_invoiced;

        let budget_status = "OK";
        if (pct_depleted > 100) budget_status = "OVER BUDGET";
        else if (pct_depleted > 90) budget_status = "LOW BALANCE";
        else if (pct_depleted > 75) budget_status = "WARNING";

        return {
          contract_id: c.id,
          client_name: c.client_name,
          contract_no: c.contract_no,
          currency: c.currency,
          original_contract_value: original,
          running_balance: Number(c.running_balance) || 0,
          total_invoiced,
          pct_depleted,
          remaining,
          budget_status
        };
      });

      return NextResponse.json(data);
    } 
    else if (type === "invoice-pipeline") {
      const invoices = await prisma.proformas_and_invoices.findMany({
        include: {
          inspections_summary: {
            include: {
              projects: {
                include: {
                  clients_and_contracts: true
                }
              }
            }
          },
          ses_records: {
              orderBy: { created_at: 'desc' },
              take: 1
          }
        }
      });

      const data = invoices.map(inv => {
        const isp = inv.inspections_summary;
        const proj = isp?.projects;
        const cli = proj?.clients_and_contracts;
        const latestSes = inv.ses_records?.[0];

        return {
          client_name: cli?.client_name,
          contract_no: cli?.contract_no,
          project_name: proj?.project_name,
          po_no: proj?.po_no,
          report_no: isp?.report_no,
          vendor_location: isp?.vendor_location,
          inspection_start_date: isp?.inspection_start_date,
          proforma_inv_no: inv.proforma_inv_no,
          proforma_inv_date: inv.proforma_inv_date,
          sap_sales_order: inv.sap_sales_order,
          invoice_no: inv.invoice_no,
          invoice_date: inv.invoice_date,
          total_amount: Number(inv.total_amount) || 0,
          payment_status: inv.payment_status,
          conso_invoice_no: inv.conso_invoice_no,
          ses_no: latestSes?.ses_no,
          ses_date: latestSes?.ses_date,
          ses_value: Number(latestSes?.ses_value) || 0,
          ses_status: latestSes?.status
        };
      });

      return NextResponse.json(data);
    }
    else if (type === "conso-invoice-detail") {
      const invoices = await prisma.proformas_and_invoices.findMany({
        where: { conso_invoice_no: { not: null } },
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
      });

      const grouped = {};
      
      invoices.forEach(inv => {
        const cno = inv.conso_invoice_no;
        if (!grouped[cno]) {
          grouped[cno] = {
            conso_invoice_no: cno,
            client_name: inv.inspections_summary?.projects?.clients_and_contracts?.client_name,
            contract_no: inv.inspections_summary?.projects?.clients_and_contracts?.contract_no,
            invoice_date: inv.invoice_date,
            total_amount: 0,
            payment_status: inv.payment_status,
            inspection_count: 0,
            report_numbers: []
          };
        }
        
        grouped[cno].total_amount += (Number(inv.total_amount) || 0);
        grouped[cno].inspection_count += 1;
        if (inv.inspections_summary?.report_no) {
          grouped[cno].report_numbers.push(inv.inspections_summary.report_no);
        }
      });

      const data = Object.values(grouped).map(g => ({
        ...g,
        report_numbers: g.report_numbers.join(', ')
      }));

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Report api error", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
