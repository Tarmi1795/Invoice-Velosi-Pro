export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.po_records.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch PO records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    Object.keys(body).forEach(k => {
      if (k === 'amount' && body[k]) body[k] = Number(body[k]);
      if (typeof body[k] === 'string' && body[k].trim() === '') body[k] = null;
    });
    const newRecord = await prisma.po_records.create({ data: body });
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create PO record" }, { status: 500 });
  }
}
