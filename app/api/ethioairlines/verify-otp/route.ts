import { NextRequest, NextResponse } from "next/server";
import { verifyEthioAirlinesOtp } from "@/lib/ethioairlines/verifyOtp";
import { isEthioAirlinesLogicalFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import {
  asRecord,
  messageFromGatewayData,
  readClientBearer,
  upstreamStatus,
} from "@/lib/ethioairlines/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      phoneNumber?: unknown;
      otpCode?: unknown;
    };

    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.replace(/\D/g, "")
        : "";
    const otpCode =
      typeof body.otpCode === "string" ? body.otpCode.replace(/\D/g, "") : "";

    if (!/^\d{9,12}$/.test(phoneNumber)) {
      return NextResponse.json(
        { message: "Phone number is missing. Request a new code." },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { message: "Enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const result = await verifyEthioAirlinesOtp(
      phoneNumber,
      otpCode,
      readClientBearer(req)
    );

    if (!result.ok) {
      const message =
        messageFromGatewayData(result.data) ||
        `Verification failed (${result.status})`;
      return NextResponse.json(
        { success: false, message },
        { status: upstreamStatus(result.status) }
      );
    }

    if (isEthioAirlinesLogicalFailure(result.data)) {
      return NextResponse.json(
        {
          success: false,
          message:
            messageFromGatewayData(result.data) ||
            "That code is incorrect or has expired.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { ...asRecord(result.data), success: true },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to verify the code";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
