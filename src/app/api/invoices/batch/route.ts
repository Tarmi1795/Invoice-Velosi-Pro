export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeRowWithOptions } from "@/lib/dataNormalizer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rows, type, inspection_ids } = body;

    if (type === 'proforma' && Array.isArray(inspection_ids)) {
      let success = 0;
      let failed = 0;
      for (const visitRef of inspection_ids) {
        try {
          await prisma.proformas_and_invoices.create({
            data: {
              inspection_id: visitRef,
              proforma_inv_date: new Date(),
              payment_status: "Pending"
            }
          });
          success++;
        } catch (e) {
          failed++;
        }
      }
      return NextResponse.json({ success, failed });
    }

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    const failedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].inspection_id) {
        failedRows.push({ row: i + 1, reason: "inspection_id is required — select an Inspection before creating an Invoice" });
      }
    }

    if (failedRows.length > 0) {
      return NextResponse.json(
        { error: "Batch validation failed", failedRows },
        { status: 400 }
      );
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const data = normalizeRowWithOptions(rows[i], {
          numberFields: ["total_amount", "credit_memo_amount"],
          dateFields: ["proforma_inv_date", "invoice_date"],
        }) as any;

        await prisma.proformas_and_invoices.create({ data });
        success++;
      } catch (e) {
        failed++;
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ error: "Batch insert failed" }, { status: 500 });
  }
}