// app/api/invitation-confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { confirmInvitation } from "@/lib/apis/order_api"; // Adjust import path as needed
import type { SendOrderData } from "@/lib/apis/order_api"; // Adjust import path as needed

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SendOrderData;
    await confirmInvitation(payload);
    return NextResponse.json(
      { message: "Invitation confirmed" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to confirm invitation" },
      { status: 500 }
    );
  }
}
