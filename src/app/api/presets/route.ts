export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.workflow_presets.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPreset = await prisma.workflow_presets.create({
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
    return NextResponse.json(newPreset, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
  }
}
