export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");

    const where = entityType ? { entity_type: entityType } : {};
    
    const trainingData = await prisma.column_mapping_training.findMany({
      where,
      orderBy: { use_count: "desc" }
    });

    return NextResponse.json(trainingData);
  } catch (e) {
    console.error("GET training data error:", e);
    return NextResponse.json({ error: "Failed to fetch training data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { excel_header, db_field, entity_type, instruction } = body;

    if (!excel_header || !db_field || !entity_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalized = excel_header.toLowerCase().replace(/[^a-z0-9]/g, "");

    const result = await prisma.column_mapping_training.upsert({
      where: {
        entity_type_excel_header: {
          entity_type,
          excel_header: normalized,
        }
      },
      update: {
        db_field,
        instruction: instruction || null,
        use_count: { increment: 1 }
      },
      create: {
        entity_type,
        excel_header: normalized,
        db_field,
        instruction: instruction || null,
        use_count: 1,
      }
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST training data error:", e);
    return NextResponse.json({ error: "Failed to save training data" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, excel_header, db_field, instruction } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const result = await prisma.column_mapping_training.update({
      where: { id },
      data: {
        excel_header: excel_header ? excel_header.toLowerCase().replace(/[^a-z0-9]/g, "") : undefined,
        db_field,
        instruction: instruction || null,
      }
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("PUT training data error:", e);
    return NextResponse.json({ error: "Failed to update training data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.column_mapping_training.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE training data error:", e);
    return NextResponse.json({ error: "Failed to delete training data" }, { status: 500 });
  }
}