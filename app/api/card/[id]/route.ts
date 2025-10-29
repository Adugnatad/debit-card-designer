import { NextRequest, NextResponse } from "next/server";
import { getCardDesignById } from "@/lib/apis/design_apis";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params

  try {
    const design = await getCardDesignById(id);
    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch design" },
      { status: 400 }
    );
  }
}

