// app/api/design/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/apis/design_apis"; // adjust import based on your folder setup
import type { Design } from "@/lib/apis/design_apis"; // adjust import based on your folder setup

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const design: Design = await getDesign(id);
    return NextResponse.json({ ...design, base: process.env.BASE_URL });
  } catch (error: any) {
    console;
    return NextResponse.json(
      { message: error.message || "Failed to fetch design" },
      { status: 500 }
    );
  }
}
