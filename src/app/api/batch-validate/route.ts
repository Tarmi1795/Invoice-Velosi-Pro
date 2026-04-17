export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { validateBatchData } from "@/lib/dataValidator";

export async function POST(request: Request) {
  try {
    const { entityType, rows } = await request.json();
    
    if (!entityType || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Missing required fields or invalid rows format" }, { status: 400 });
    }

    const issues = await validateBatchData(entityType, rows);
    return NextResponse.json({ issues, timestamp: Date.now() });

  } catch (error) {
    console.error("[batch-validate] Error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
