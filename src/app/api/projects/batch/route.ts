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
        await prisma.projects.create({
          data: {
            contract_id: row.contract_id || null,
            project_name: row.project_name || null,
            po_no: row.po_no || null,
            itp_code: row.itp_code || null,
            focal_name: row.focal_name || null,
            focal_email: row.focal_email || null,
            active_status: row.active_status === true || row.active_status === "true",
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