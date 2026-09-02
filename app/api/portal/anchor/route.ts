import { NextRequest, NextResponse } from "next/server";
import { confirmEthioAirlinesCheckout } from "@/lib/ethioairlines/confirm";
import { isEthioAirlinesConfirmFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import {
  isValidCheckoutKey,
  sanitizeCheckoutKey,
} from "@/lib/ethioairlines/checkoutKey";
import {
  gateConfirm,
  hashCheckoutKey,
  recordConfirmOutcome,
} from "@/lib/ethioairlines/checkoutSession";
import { hit, LIMITS } from "@/lib/ethioairlines/rateLimit";
import { guardRequest } from "@/lib/ethioairlines/requestGuard";
import {
  CLIENT_MESSAGE,
  maskAccountForLog,
  messageFromGatewayData,
  pickConfirmFields,
  truncateKeyForLog,
} from "@/lib/ethioairlines/routeHelpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "anchor");
  if (blocked) return blocked;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      s?: unknown;
      key?: unknown;
      token?: unknown;
    };

    const rawKey =
      typeof body.key === "string"
        ? body.key
        : typeof body.token === "string"
          ? body.token
          : "";
    const checkoutKey = sanitizeCheckoutKey(rawKey);
    if (!isValidCheckoutKey(checkoutKey)) {
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.badLink },
        { status: 400 }
      );
    }

    /**
     * The gate is the whole point of this route now. It requires a live session
     * that actually completed OTP, and whose checkout key matches.
     *
     * Before this, confirm checked nothing: a valid-looking key plus any
     * 13-digit account moved money, and the OTP steps were a client-side speed
     * bump. The account and messageId are read from the session, so a body
     * value for either is ignored rather than trusted.
     */
    const keyHash = hashCheckoutKey(checkoutKey);
    const gateLimit = hit(
      `cf:${keyHash}`,
      LIMITS.confirmPerKey.limit,
      LIMITS.confirmPerKey.windowMs
    );
    if (!gateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.unavailable },
        {
          status: 429,
          headers: { "Retry-After": String(gateLimit.retryAfterSec) },
        }
      );
    }

    const gate = gateConfirm(body.s, keyHash);

    if (!gate.ok) {
      const status = gate.reason === "invalid" ? 400 : 403;
      console.warn("[ethioairlines/confirm] blocked", {
        reason: gate.reason,
        checkoutKey: truncateKeyForLog(checkoutKey),
      });
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.confirmFailed },
        { status }
      );
    }

    // A repeat of an already-completed confirm replays the stored outcome
    // instead of debiting again -- the client legitimately retries after a
    // network timeout and must not be able to double-spend by doing so.
    if ("replay" in gate) {
      return NextResponse.json(gate.replay.body, {
        status: gate.replay.status,
      });
    }

    const { session } = gate;
    const { acct: debitAccount, messageId } = session;

    const result = await confirmEthioAirlinesCheckout({
      checkoutKey,
      messageId,
      debitAccount,
    });

    const failed = !result.ok || isEthioAirlinesConfirmFailure(result.data);

    // Whitelisted log view. `data: result.data` previously wrote the entire
    // upstream body to stdout beside fields that were carefully masked.
    console.log("[ethioairlines/confirm]", {
      messageId,
      debitAccount: maskAccountForLog(debitAccount),
      checkoutKey: truncateKeyForLog(checkoutKey),
      status: result.status,
      ok: !failed,
      fields: pickConfirmFields(result.data),
      detail: failed ? messageFromGatewayData(result.data) : undefined,
    });

    const outcome = failed
      ? {
          status: 422,
          body: {
            success: false,
            messageId,
            message: CLIENT_MESSAGE.confirmFailed,
          },
        }
      : {
          status: 200,
          body: {
            success: true,
            messageId,
            ...pickConfirmFields(result.data),
          },
        };

    // Record success AND failure: a failed attempt must not be silently
    // retryable into a second upstream debit either.
    recordConfirmOutcome(body.s as string, outcome);

    return NextResponse.json(outcome.body, { status: outcome.status });
  } catch (e: unknown) {
    console.error("[ethioairlines/confirm] threw", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { success: false, message: CLIENT_MESSAGE.unavailable },
      { status: 502 }
    );
  }
}
