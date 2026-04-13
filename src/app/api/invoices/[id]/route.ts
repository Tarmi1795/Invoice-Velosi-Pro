
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    Object.keys(body).forEach(k => {
      if (['work_duration', 'ot_duration', 'mileage', 'expenses_amount', 'total_amount', 'credit_memo_amount', 'ses_value', 'original_contract_value', 'running_balance'].includes(k)) {
        if(body[k]) body[k] = Number(body[k]);
      }
      if (k.includes('date') && body[k]) {
        body[k] = new Date(body[k]);
      }
      if (typeof body[k] === 'string' && body[k].trim() === '') {
        body[k] = null;
      }
      if (k === 'active_status' || k === 'ts_file_verified') {
        if (typeof body[k] === 'string') body[k] = body[k].toLowerCase() === 'true';
      }
    });
    const updated = await prisma.proformas_and_invoices.update({
      where: { id: id },
      data: body
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
      const { id } = await params;
    await prisma.proformas_and_invoices.delete({
      where: { id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
