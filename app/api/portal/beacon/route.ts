import { NextRequest, NextResponse } from "next/server";
import { verifyEthioAirlinesOtp } from "@/lib/ethioairlines/verifyOtp";
import { isEthioAirlinesLogicalFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import {
  beginVerifyAttempt,
  markOtpVerified,
} from "@/lib/ethioairlines/checkoutSession";
import { guardRequest } from "@/lib/ethioairlines/requestGuard";
import {
  CLIENT_MESSAGE,
  messageFromGatewayData,
} from "@/lib/ethioairlines/routeHelpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "beacon");
  if (blocked) return blocked;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      s?: unknown;
      otpCode?: unknown;
    };

    const otpCode =
      typeof body.otpCode === "string" ? body.otpCode.replace(/\D/g, "") : "";
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.badCode },
        { status: 400 }
      );
    }

    // The phone number comes from server-side session state, never from the
    // request. Previously it was a body field with no link to whoever requested
    // the OTP, so any known number could be targeted. The attempt is counted
    // BEFORE the upstream call, and five wrong guesses burn the session --
    // otherwise a 6-digit code falls to brute force.
    const gate = beginVerifyAttempt(body.s);
    if (!gate.ok) {
      // `sessionLost` also tells the client to send the user back to step 1.
      const lost = gate.reason === "invalid";
      return NextResponse.json(
        {
          success: false,
          sessionLost: lost,
          message: lost
            ? CLIENT_MESSAGE.sessionLost
            : CLIENT_MESSAGE.otpRejected,
        },
        { status: gate.reason === "exhausted" ? 429 : 400 }
      );
    }

    const result = await verifyEthioAirlinesOtp(gate.session.phone, otpCode);

    if (!result.ok || isEthioAirlinesLogicalFailure(result.data)) {
      console.warn("[ethioairlines/verify-otp] rejected", {
        status: result.status,
        attempt: gate.session.verifyAttempts,
        detail: messageFromGatewayData(result.data),
      });
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.otpRejected },
        { status: 422 }
      );
    }

    // Flip the flag server-side. It is not representable in anything the client
    // holds, so it cannot be forged.
    markOtpVerified(body.s as string);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    console.error("[ethioairlines/verify-otp] threw", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { success: false, message: CLIENT_MESSAGE.unavailable },
      { status: 502 }
    );
  }
}
