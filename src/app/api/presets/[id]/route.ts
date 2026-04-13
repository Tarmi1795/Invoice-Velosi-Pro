export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
        company_address: body.company_address,
        company_contact: body.company_contact,
        bank_details: body.bank_details,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await prisma.workflow_presets.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
  }
}
