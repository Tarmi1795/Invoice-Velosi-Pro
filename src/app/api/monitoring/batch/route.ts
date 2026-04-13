export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body; // Array of ITP objects

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const results = await Promise.all(items.map(async (item) => {
      // Find project by name or ID if possible, otherwise skip or handle
      let projectId = item.project_id;
      if (!projectId && item.project_name) {
        const p = await prisma.projects.findFirst({ where: { project_name: item.project_name } });
        projectId = p?.id;
      }

      // Find inspector by name if possible
      let inspectorId = item.inspector_id;
      if (!inspectorId && item.inspector_name) {
        const i = await prisma.inspectors.findFirst({ where: { full_name: item.inspector_name } });
        inspectorId = i?.id;
      }

      if (!projectId) return { status: 'error', item: item.itp_po_number, error: 'Project not found' };

      try {
        const created = await prisma.itp_pos.create({
          data: {
            project_id: projectId,
            itp_po_number: item.itp_po_number,
            location: item.location,
            inspector_id: inspectorId,
            expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
            designation: item.designation,
            rates: item.rates ? Number(String(item.rates).replace(/[^0-9.-]/g, "")) : 0,
            original_budget: item.budget ? Number(String(item.budget).replace(/[^0-9.-]/g, "")) : 0,
            status: "Active"
          }
        });
        return { status: 'success', id: created.id };
      } catch (e) {
        return { status: 'error', item: item.itp_po_number, error: String(e) };
      }
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Batch upload failed" }, { status: 500 });
  }
}
