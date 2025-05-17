import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/apis/otp_api"; // adjust path as needed

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();
    const result = await sendOtp({ phoneNumber });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to send OTP" },
      { status: 400 }
    );
  }
}
