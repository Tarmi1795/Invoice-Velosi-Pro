export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeRowWithOptions } from "@/lib/dataNormalizer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items || body.rows;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        let projectId = item.project_id;
        if (!projectId && item.project_name) {
          const p = await prisma.projects.findFirst({ where: { project_name: item.project_name } });
          projectId = p?.id;
        }

        let inspectorId = item.inspector_id;
        if (!inspectorId && item.inspector_name) {
          const insp = await prisma.inspectors.findFirst({ where: { full_name: item.inspector_name } });
          inspectorId = insp?.id;
        }

        if (!projectId) {
          failed++;
          errors.push(`Row ${i + 1}: No project found matching "${item.project_name}" — ITP/PO must be linked to an existing Project`);
          continue;
        }

        const data = normalizeRowWithOptions(item, {
          numberFields: ["rates", "original_budget"],
          dateFields: ["expiry_date"],
        }) as any;

        await prisma.itp_pos.create({
          data: {
            ...data,
            project_id: projectId,
            inspector_id: inspectorId || null,
            status: item.status || "Active",
          }
        });
        success++;
      } catch (e) {
        failed++;
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Batch upload failed" }, { status: 500 });
  }
}
