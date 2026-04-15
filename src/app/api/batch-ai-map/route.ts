export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { analyzeColumns, getAvailableFields, saveUserCorrection } from "@/lib/aiColumnMapper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, headers, sampleRows } = body;

    console.log("[batch-ai-map] POST received:", { entityType, headers: headers?.slice(0, 5), sampleRowsCount: sampleRows?.length });

    if (!entityType || !headers || !sampleRows) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const availableFields = getAvailableFields(entityType);
    console.log("[batch-ai-map] Available fields for", entityType, ":", availableFields);

    const result = await analyzeColumns(entityType, headers, sampleRows);
    console.log("[batch-ai-map] Analysis result:", { mappingsCount: result.mappings.length, unmappedCount: result.unmappedHeaders.length });

    return NextResponse.json({
      ...result,
      availableFields,
    });
  } catch (e) {
    console.error("[batch-ai-map] Error:", e);
    return NextResponse.json({ error: "Analysis failed: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { entityType, mappings, trainingData } = body;

    if (!entityType || !mappings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (trainingData && Array.isArray(trainingData)) {
      for (const training of trainingData) {
        if (training.header && training.field) {
          await saveUserCorrection(entityType, training.header, training.field, training.instruction);
        }
      }
    }

    return NextResponse.json({ success: true, savedCount: trainingData?.length || 0 });
  } catch (e) {
    console.error("Training save error:", e);
    return NextResponse.json({ error: "Failed to save training data" }, { status: 500 });
  }
}