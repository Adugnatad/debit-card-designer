// app/api/order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { submitOrder } from "@/lib/apis/order_api"; // adjust import path
import type { orderPayload } from "@/lib/apis/order_api"; // adjust import path

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as orderPayload;

    await submitOrder(payload);
    return NextResponse.json(
      { message: "Order submitted successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to submit order" },
      { status: 500 }
    );
  }
}
