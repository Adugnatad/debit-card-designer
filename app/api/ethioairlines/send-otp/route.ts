import { NextRequest, NextResponse } from "next/server";
import { sendEthioAirlinesOtp } from "@/lib/ethioairlines/sendOtp";
import { isEthioAirlinesLogicalFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import {
  asRecord,
  messageFromGatewayData,
  readClientBearer,
  upstreamStatus,
} from "@/lib/ethioairlines/routeHelpers";
import { maskPhoneForOtpHint } from "@/lib/fifaworldcup/maskPhoneNumber";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      accountNumber?: unknown;
    };
    const accountNumber =
      typeof body.accountNumber === "string"
        ? body.accountNumber.trim().replace(/\D/g, "").slice(0, 13)
        : "";

    if (!/^\d{13}$/.test(accountNumber)) {
      return NextResponse.json(
        { message: "Please enter a valid 13-digit account number." },
        { status: 400 }
      );
    }

    const result = await sendEthioAirlinesOtp(
      accountNumber,
      readClientBearer(req)
    );

    if (!result.ok) {
      const message =
        messageFromGatewayData(result.data) ||
        `Unable to send the verification code (${result.status})`;
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
            "We could not send a verification code for that account.",
        },
        { status: 422 }
      );
    }

    const payload = asRecord(result.data);
    const phoneNumber =
      typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "No phone number is registered for that account.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        phoneNumber,
        maskedPhone: maskPhoneForOtpHint(phoneNumber),
        message:
          typeof payload.message === "string" ? payload.message : undefined,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to send the verification code";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
