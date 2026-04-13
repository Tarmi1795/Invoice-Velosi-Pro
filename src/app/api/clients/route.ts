export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const clients = await prisma.clients_and_contracts.findMany({
    include: { workflow_presets: true }
  });
  return NextResponse.json(clients, { 
    headers: { 'Cache-Control': 'no-store, must-revalidate' }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.contract_start_date) body.contract_start_date = new Date(body.contract_start_date);
  if (body.contract_end_date) body.contract_end_date = new Date(body.contract_end_date);
  const client = await prisma.clients_and_contracts.create({
    data: {
      client_name: body.client_name,
      contract_no: body.contract_no,
      currency: body.currency,
      original_contract_value: Number(body.original_contract_value) || 0,
      contract_start_date: body.contract_start_date || null,
      contract_end_date: body.contract_end_date || null,
      preset_id: body.preset_id,
    }
  });
  return NextResponse.json(client);
}
