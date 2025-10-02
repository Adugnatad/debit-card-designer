// app/api/design/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/apis/design_apis"; // adjust import based on your folder setup
import { DesignSnapshot } from "@/lib/types";
import { baseUrl } from "@/lib/constant";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const design: DesignSnapshot | null = await getDesign(id);
    return NextResponse.json({ ...design, base: baseUrl });
  } catch (error: any) {
    console.error("Failed to fetch design:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch design" },
      { status: 500 }
    );
  }
}
