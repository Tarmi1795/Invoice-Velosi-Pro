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

        let inspectorId = item.employee_no || item.inspector_id;

        // Detect if the mapper incorrectly placed a name (letters/spaces) into inspector_id
        // instead of an actual employee_no. Employee nos typically contain numbers.
        const looksLikeName = typeof inspectorId === 'string' && /^[A-Za-z\s\.\/]+$/.test(inspectorId);
        const searchName = looksLikeName ? inspectorId : item.inspector_name;
        if (searchName) {
          inspectorId = null; // default to null if no match found

          // Try multiple matching strategies
          const strategies = [
            // 1. Exact uppercase contains (catches "LIANG DUJING" → "LIANG DUJING")
            () => prisma.inspectors.findFirst({ where: { full_name: { contains: searchName.toUpperCase() } } }),
            // 2. Exact lowercase contains (catches mixed case)
            () => prisma.inspectors.findFirst({ where: { full_name: { contains: searchName.toLowerCase() } } }),
            // 3. Strip "Mr."/"Ms." title and search core last name
            () => {
              const core = searchName.replace(/^(mr|ms|mrs)\.\s+/i, "").trim();
              if (core !== searchName) {
                return prisma.inspectors.findFirst({ where: { full_name: { contains: core } } });
              }
              return null;
            },
            // 4. Try last-name-only match (for "Firstname Lastname" vs "Lastname")
            () => {
              const parts = searchName.split(/\s+/);
              const lastName = parts[parts.length - 1].replace(/[^a-zA-Z]/g, "");
              if (lastName.length > 3) {
                return prisma.inspectors.findFirst({ where: { full_name: { contains: lastName } } });
              }
              return null;
            },
            // 5. Exact match as fallback
            () => prisma.inspectors.findFirst({ where: { full_name: { equals: searchName } } }),
          ];

          for (const strategy of strategies) {
            const insp = await strategy();
            if (insp?.employee_no) {
              inspectorId = insp.employee_no;
              break;
            }
          }
        }

        const data = normalizeRowWithOptions(item, {
          numberFields: ["rates", "original_budget"],
          dateFields: ["expiry_date"],
        }) as any;

        // Strip fields that aren't part of itp_pos model but may come from Excel/normalized data
        delete data.project_name;
        delete data.inspector_name;
        delete data.employee_no;

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
