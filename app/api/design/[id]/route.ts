// app/api/design/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/apis/design_apis"; // adjust import based on your folder setup
import { DesignSnapshot } from "@/lib/types";
import { baseUrl } from "@/lib/constant";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params

  try {
    const design = await getDesign(id);
    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch design" },
      { status: 400 }
    );
  }
}

