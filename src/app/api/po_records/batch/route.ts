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
        const data: any = {};
        const numberFields = ["amount"];

        Object.keys(row).forEach(k => {
          if (numberFields.includes(k) && row[k]) data[k] = Number(row[k]);
          else if (typeof row[k] === "string" && row[k].trim() === "") data[k] = null;
          else if (!["id", "created_at", "updated_at"].includes(k)) data[k] = row[k];
        });

        await prisma.po_records.create({ data });
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
