export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await prisma.itp_pos.findUnique({ 
      where: { id },
      include: { revisions: true }
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ITP/PO record" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Normalize numeric fields
    const numericFields = ['rates', 'original_budget', 'total_invoiced'];
    numericFields.forEach(f => {
      if (body[f] !== undefined) body[f] = Number(body[f]);
    });

    // Normalize dates
    if (body.expiry_date) body.expiry_date = new Date(body.expiry_date);

    const updated = await prisma.itp_pos.update({ 
      where: { id }, 
      data: body 
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[monitoring/[id]] PUT error:", error);
    return NextResponse.json({ error: "Failed to update ITP/PO record" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Use a transaction to ensure all associated records are cleaned up
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated revisions
      await tx.itp_revisions.deleteMany({ where: { itp_po_id: id } });
      
      // 2. Delete the record itself
      await tx.itp_pos.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[monitoring/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete ITP/PO record" }, { status: 500 });
  }
}
