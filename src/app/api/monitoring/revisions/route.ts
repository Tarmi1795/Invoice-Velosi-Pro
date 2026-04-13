export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Add a revision to an ITP
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itp_po_id, budget_adjustment, new_expiry_date, remarks } = body;

    // Get current max revision no for this ITP
    const lastRev = await prisma.itp_revisions.findFirst({
      where: { itp_po_id },
      orderBy: { revision_no: 'desc' }
    });
    
    const nextRevNo = (lastRev?.revision_no || 0) + 1;

    const revision = await prisma.itp_revisions.create({
      data: {
        itp_po_id,
        revision_no: nextRevNo,
        budget_adjustment: Number(budget_adjustment) || 0,
        new_expiry_date: new_expiry_date ? new Date(new_expiry_date) : null,
        remarks
      }
    });

    // Update the parent ITP's expiry_date if a new one is provided
    if (new_expiry_date) {
      await prisma.itp_pos.update({
        where: { id: itp_po_id },
        data: { expiry_date: new Date(new_expiry_date) }
      });
    }

    return NextResponse.json(revision, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add revision" }, { status: 500 });
  }
}
