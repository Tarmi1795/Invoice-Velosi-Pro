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
        await prisma.inspectors.create({
          data: {
            full_name: row.full_name || row.name || null,
            job_title: row.job_title || row.title || null,
            base_location: row.base_location || row.location || null,
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