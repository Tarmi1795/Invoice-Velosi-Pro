export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeRowWithOptions } from "@/lib/dataNormalizer";

export async function POST(request: Request) {
  try {
    const { rows } = await request.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    const failedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].proforma_inv_id) {
        failedRows.push({ row: i + 1, reason: "proforma_inv_id is required — select a Proforma Invoice before creating an SES record" });
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
          stringFields: [],
          numberFields: ["ses_value"],
          dateFields: ["ses_date"],
        }) as any;

        await prisma.ses_records.create({ data });
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