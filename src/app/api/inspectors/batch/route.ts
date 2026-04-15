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

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const data = normalizeRowWithOptions(rows[i], {}) as any;
        if (!data.full_name && data.name) data.full_name = data.name;
        if (!data.job_title && data.title) data.job_title = data.title;
        if (!data.base_location && data.location) data.base_location = data.location;

        await prisma.inspectors.create({ data });
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