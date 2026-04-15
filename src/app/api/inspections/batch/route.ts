export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { rows } = await request.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    const failedRows: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].inspector_id) {
        failedRows.push({ row: i + 1, reason: "inspector_id is required" });
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

    for (const row of rows) {
      try {
        const data: any = { project_id: row.project_id || null, inspector_id: row.inspector_id || null };
        const dateFields = ["inspection_start_date", "inspection_end_date"];
        const numberFields = ["work_duration", "ot_duration", "mileage", "expenses_amount"];
        
        Object.keys(row).forEach(k => {
          if (dateFields.includes(k) && row[k]) data[k] = new Date(row[k]);
          else if (numberFields.includes(k) && row[k]) data[k] = Number(row[k]);
          else if (k === "ts_file_verified") data[k] = row[k] === true || row[k] === "true";
          else if (!["id", "created_at", "updated_at"].includes(k)) data[k] = row[k];
        });

        await prisma.inspections_summary.create({ data });
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