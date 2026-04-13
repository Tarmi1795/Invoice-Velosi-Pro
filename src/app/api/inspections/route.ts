
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.inspections_summary.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const newData = await prisma.inspections_summary.create({
      data: body
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
