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

    const skippedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].visit_ref) {
        skippedRows.push({ row: i + 1, reason: "visit_ref is required. Skipping." });
      }
    }

    if (skippedRows.length > 0) {
      return NextResponse.json(
        { error: "Batch validation failed", skippedRows },
        { status: 400 }
      );
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const data = normalizeRowWithOptions(rows[i], {
          numberFields: ["work_duration", "ot_duration", "mileage", "expenses_amount"],
          dateFields: ["inspection_start_date", "inspection_end_date"],
          booleanFields: ["ts_file_verified"],
        }) as any;

        await prisma.inspections_summary.create({ data });
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