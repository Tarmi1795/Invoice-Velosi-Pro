
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [sesRecords, itpPos] = await Promise.all([
      prisma.ses_records.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.itp_pos.findMany({
        include: { projects: { select: { project_name: true } } }
      })
    ]);

    const itpPosMap = new Map(itpPos.map(ip => [ip.id, { itp_po_number: ip.itp_po_number, project_name: ip.projects?.project_name }]));

    const data = sesRecords.map(sr => ({
      ...sr,
      itp_pos: sr.itp_po_id ? itpPosMap.get(sr.itp_po_id) || null : null
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.proforma_inv_id) {
      return NextResponse.json(
        { error: "proforma_inv_id is required to create an SES record" },
        { status: 400 }
      );
    }

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

    const newData = await prisma.ses_records.create({
      data: body
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
