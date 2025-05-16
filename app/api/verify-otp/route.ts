import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/apis/otp_api"; // adjust path as needed

export async function POST(req: NextRequest) {
  try {
    const { id, otp } = await req.json();
    const result = await verifyOtp({ id, otp });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
