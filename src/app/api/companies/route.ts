export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const companies = await prisma.company_profiles.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const body = await request.json();
  const company = await prisma.company_profiles.create({
    data: {
      name: body.name,
      address: body.address,
      contact: body.contact,
      bank_details: body.bank_details,
      logo_path: body.logo_path || "templates/logos/velosi_logo.png",
    }
  });
  return NextResponse.json(company, { status: 201 });
}
