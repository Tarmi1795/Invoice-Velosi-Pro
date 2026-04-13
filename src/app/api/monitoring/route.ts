export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const itp_pos = await prisma.itp_pos.findMany({
      include: {
        projects: {
          include: { clients_and_contracts: true }
        },
        inspectors: true,
        revisions: { orderBy: { revision_no: 'desc' } }
      }
    });

    const monitoringData = itp_pos.map(itp => {
      // Calculate current budget from revisions
      const revisionsBudget = itp.revisions.reduce((acc, rev) => acc + (rev.budget_adjustment || 0), 0);
      const totalBudget = (itp.original_budget || 0) + revisionsBudget;
      
      const invoiced = itp.total_invoiced || 0;
      const runningBalance = totalBudget - invoiced;
      
      // Determine status based on expiry and budget
      const now = new Date();
      let status = "Healthy";
      const expiry = itp.expiry_date ? new Date(itp.expiry_date) : null;
      
      if (runningBalance < 0) status = "Over Budget";
      else if (runningBalance < (totalBudget * 0.15)) status = "Low Balance";
      
      if (expiry) {
        if (expiry < now) status = "Expired";
        else if (expiry.getTime() - now.getTime() < (30 * 24 * 60 * 60 * 1000)) {
           // Within 30 days
           if (status === "Healthy") status = "Expiring Soon";
        }
      }

      return {
        id: itp.id,
        itp_po_number: itp.itp_po_number,
        contract_no: itp.projects?.clients_and_contracts?.contract_no || "N/A",
        client_name: itp.projects?.clients_and_contracts?.client_name || "Unknown",
        project_name: itp.projects?.project_name || "Unknown",
        location: itp.location,
        inspector: itp.inspectors?.full_name || "Not Assigned",
        expiry_date: itp.expiry_date,
        designation: itp.designation,
        rates: itp.rates,
        budget: totalBudget,
        invoiced: invoiced,
        running_balance: runningBalance,
        revision_count: itp.revisions.length,
        latest_remarks: itp.revisions[0]?.remarks || "None",
        latest_revision_date: itp.revisions[0]?.created_at || null,
        status: status
      };
    });

    return NextResponse.json(monitoringData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch ITP monitoring data" }, { status: 500 });
  }
}

// Create new ITP/PO
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itp = await prisma.itp_pos.create({
      data: {
        project_id: body.project_id,
        itp_po_number: body.itp_po_number,
        location: body.location,
        inspector_id: body.inspector_id,
        expiry_date: body.expiry_date ? new Date(body.expiry_date) : null,
        designation: body.designation,
        rates: Number(body.rates) || 0,
        original_budget: Number(body.original_budget) || 0,
        status: "Active"
      }
    });
    return NextResponse.json(itp, { status: 201 });
  } catch (error) {
     return NextResponse.json({ error: "Failed to create ITP" }, { status: 500 });
  }
}
