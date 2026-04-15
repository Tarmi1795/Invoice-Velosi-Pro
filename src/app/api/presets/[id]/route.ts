export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await prisma.workflow_presets.update({
      where: { id },
      data: {
        preset_name: body.preset_name,
        description: body.description,
        visible_fields: body.visible_fields,
        workflow_steps: body.workflow_steps,
        default_values: body.default_values,
        invoice_template: body.invoice_template,
        company_profile_id: body.company_profile_id,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Disconnect any contracts using this preset
    await prisma.clients_and_contracts.updateMany({
      where: { preset_id: id },
      data: { preset_id: null }
    });

    // 2. Delete the preset
    await prisma.workflow_presets.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete preset error:", error);
    return NextResponse.json({ error: "Failed to delete preset. It might be in use." }, { status: 500 });
  }
}
