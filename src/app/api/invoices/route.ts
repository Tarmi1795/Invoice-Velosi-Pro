
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.proformas_and_invoices.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/invoices body:', JSON.stringify(body, null, 2));
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
    console.log('Processed body:', JSON.stringify(body, null, 2));

    const newData = await prisma.proformas_and_invoices.create({
      data: body
    });
    console.log('Created:', JSON.stringify(newData, null, 2));
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
