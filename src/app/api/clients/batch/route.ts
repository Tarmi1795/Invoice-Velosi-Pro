export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { rows } = await request.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        if (row.contract_start_date) row.contract_start_date = new Date(row.contract_start_date);
        if (row.contract_end_date) row.contract_end_date = new Date(row.contract_end_date);
        
        await prisma.clients_and_contracts.create({
          data: {
            client_name: row.client_name || null,
            contract_no: row.contract_no || null,
            currency: row.currency || "QAR",
            original_contract_value: row.original_contract_value ? Number(row.original_contract_value) : null,
            running_balance: row.running_balance ? Number(row.running_balance) : null,
            description: row.description || null,
            contract_start_date: row.contract_start_date || null,
            contract_end_date: row.contract_end_date || null,
            preset_id: row.preset_id || null,
          },
        });
        success++;
      } catch (e) {
        failed++;
        errors.push(`Row ${success + failed}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ error: "Batch insert failed" }, { status: 500 });
  }
}