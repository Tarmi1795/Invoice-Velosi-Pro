export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company_profiles.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await prisma.company_profiles.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address,
      contact: body.contact,
      bank_details: body.bank_details,
      logo_path: body.logo_path,
    }
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // 1. Disconnect any presets using this company profile
    await prisma.workflow_presets.updateMany({
      where: { company_profile_id: id },
      data: { company_profile_id: null }
    });

    // 2. Delete the profile
    await prisma.company_profiles.delete({ where: { id } });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete company error:", error);
    return NextResponse.json({ error: "Failed to delete company profile. It might be in use." }, { status: 500 });
  }
}
