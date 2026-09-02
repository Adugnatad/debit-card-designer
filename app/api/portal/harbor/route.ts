import { NextRequest, NextResponse } from "next/server";
import { sendEthioAirlinesOtp } from "@/lib/ethioairlines/sendOtp";
import { isEthioAirlinesLogicalFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import { parseCheckoutKey } from "@/lib/ethioairlines/checkoutKey";
import { generateEthioAirlinesMessageId } from "@/lib/ethioairlines/messageId";
import { createSession, hashCheckoutKey } from "@/lib/ethioairlines/checkoutSession";
import {
  asRecord,
  CLIENT_MESSAGE,
  maskAccountForLog,
  messageFromGatewayData,
} from "@/lib/ethioairlines/routeHelpers";
import { hit, LIMITS } from "@/lib/ethioairlines/rateLimit";
import { guardRequest } from "@/lib/ethioairlines/requestGuard";
import { maskPhoneForOtpHint } from "@/lib/fifaworldcup/maskPhoneNumber";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let accountNumber = "";
  const blocked = guardRequest(req, "harbor");
  if (blocked) return blocked;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      accountNumber?: unknown;
      key?: unknown;
    };

    // The checkout key is REQUIRED here. Without it an account number alone was
    // enough to fire a real SMS at any Coop customer.
    //
    // parseCheckoutKey, not isValidCheckoutKey: the latter is a charset/length
    // gate that any random base64 string passes. This requires the key to
    // actually decode to base64(base64("urn:uuid:..") + epoch), which random
    // junk will not.
    const parsed = parseCheckoutKey(body.key as string | undefined);
    const keyWellFormed = parsed.status === "ok" && !!parsed.bookingRef;

    if (!keyWellFormed) {
      console.warn("[ethioairlines/send-otp] key rejected", {
        status: parsed.status,
        hasBookingRef: !!parsed.bookingRef,
      });
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.badLink },
        { status: 400 }
      );
    }

    /**
     * Trailing epoch: SHADOW MODE -- logged, never gated. Do not turn this into
     * a rejection until the airline confirms what the value means.
     *
     * It is only known that the sample key's epoch equalled roughly the moment
     * the key was issued. That is equally consistent with "expires at" (short
     * TTL) and with "issued at". If it is issued-at, the value is ALWAYS in the
     * past, and gating on it would reject every genuine customer -- a total
     * outage. One sample cannot distinguish the two.
     *
     * Enable via ETHIO_AIRLINES_ENFORCE_KEY_EXPIRY=1 once confirmed, after
     * reading real values out of these log lines.
     */
    if (parsed.expiresAtMs !== null && parsed.expiresAtMs <= Date.now()) {
      const ageMin = Math.round((Date.now() - parsed.expiresAtMs) / 60_000);
      console.warn("[ethioairlines/key-epoch-shadow]", {
        epoch: new Date(parsed.expiresAtMs).toISOString(),
        minutesInPast: ageMin,
        wouldReject: true,
      });
      if (process.env.ETHIO_AIRLINES_ENFORCE_KEY_EXPIRY?.trim() === "1") {
        return NextResponse.json(
          { success: false, message: CLIENT_MESSAGE.linkExpired },
          { status: 400 }
        );
      }
    }

    accountNumber =
      typeof body.accountNumber === "string"
        ? body.accountNumber.trim().replace(/\D/g, "").slice(0, 13)
        : "";

    if (!/^\d{13}$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.badAccount },
        { status: 400 }
      );
    }

    const gateLimit = hit(
      `otp:${accountNumber}`,
      LIMITS.sendOtpPerAccount.limit,
      LIMITS.sendOtpPerAccount.windowMs
    );
    if (!gateLimit.allowed) {
      console.warn("[ethioairlines/send-otp] rate limited", {
        account: maskAccountForLog(accountNumber),
        count: gateLimit.count,
      });
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.unavailable },
        {
          status: 429,
          headers: { "Retry-After": String(gateLimit.retryAfterSec) },
        }
      );
    }

    const result = await sendEthioAirlinesOtp(accountNumber);
    const payload = asRecord(result.data);
    const phoneNumber =
      typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";

    const failed =
      !result.ok || isEthioAirlinesLogicalFailure(result.data) || !phoneNumber;

    // One reply for unknown account / no registered phone / gateway refusal.
    // Three distinct replies were an account-existence oracle.
    if (failed) {
      console.warn("[ethioairlines/send-otp] failed", {
        account: maskAccountForLog(accountNumber),
        status: result.status,
        detail: messageFromGatewayData(result.data),
      });
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.otpNotSent },
        { status: 422 }
      );
    }

    // messageId is minted server-side and pinned to the session. It used to be
    // client-supplied and optional, so an attacker could vary it to defeat
    // upstream de-duplication.
    const s = createSession({
      acct: accountNumber,
      phone: phoneNumber,
      keyHash: hashCheckoutKey(parsed.key),
      messageId: generateEthioAirlinesMessageId(),
    });

    // The raw MSISDN never leaves the server -- only the masked display hint
    // and an opaque handle to the server-side session.
    return NextResponse.json(
      { success: true, s, maskedPhone: maskPhoneForOtpHint(phoneNumber) },
      { status: 200 }
    );
  } catch (e: unknown) {
    console.error("[ethioairlines/send-otp] threw", {
      account: maskAccountForLog(accountNumber),
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { success: false, message: CLIENT_MESSAGE.unavailable },
      { status: 502 }
    );
  }
}
