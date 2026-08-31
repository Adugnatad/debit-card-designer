import { NextRequest, NextResponse } from "next/server";
import { confirmEthioAirlinesCheckout } from "@/lib/ethioairlines/confirm";
import { isEthioAirlinesConfirmFailure } from "@/lib/ethioairlines/ethioAirlinesGatewaySuccess";
import {
  isValidCheckoutKey,
  sanitizeCheckoutKey,
} from "@/lib/ethioairlines/checkoutKey";
import {
  generateEthioAirlinesMessageId,
  isValidEthioAirlinesMessageId,
} from "@/lib/ethioairlines/messageId";
import {
  asRecord,
  maskAccountForLog,
  messageFromGatewayData,
  truncateKeyForLog,
  upstreamStatus,
} from "@/lib/ethioairlines/routeHelpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Declared outside the try so the catch can still echo it back -- the client
  // must reuse the same messageId when retrying.
  let messageId = "";

  try {
    const body = (await req.json().catch(() => ({}))) as {
      key?: unknown;
      token?: unknown;
      messageId?: unknown;
      debitAccount?: unknown;
    };

    // Re-sanitize server-side: never trust what the client sends back.
    const rawKey =
      typeof body.key === "string"
        ? body.key
        : typeof body.token === "string"
          ? body.token
          : "";
    const checkoutKey = sanitizeCheckoutKey(rawKey);

    if (!isValidCheckoutKey(checkoutKey)) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment link is invalid or incomplete.",
        },
        { status: 400 }
      );
    }

    const debitAccount =
      typeof body.debitAccount === "string"
        ? body.debitAccount.trim().replace(/\D/g, "").slice(0, 13)
        : "";

    if (!/^\d{13}$/.test(debitAccount)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 13-digit account number.",
        },
        { status: 400 }
      );
    }

    messageId = isValidEthioAirlinesMessageId(body.messageId)
      ? body.messageId
      : generateEthioAirlinesMessageId();

    const result = await confirmEthioAirlinesCheckout({
      checkoutKey,
      messageId,
      debitAccount,
    });

    console.log("[ethioairlines/confirm]", {
      messageId,
      debitAccount: maskAccountForLog(debitAccount),
      checkoutKey: truncateKeyForLog(checkoutKey),
      status: result.status,
      ok: result.ok,
      data: result.data,
    });

    if (!result.ok) {
      const message =
        messageFromGatewayData(result.data) ||
        `We could not complete the payment (${result.status})`;
      return NextResponse.json(
        { success: false, messageId, message },
        { status: upstreamStatus(result.status) }
      );
    }

    if (isEthioAirlinesConfirmFailure(result.data)) {
      return NextResponse.json(
        {
          success: false,
          messageId,
          message:
            messageFromGatewayData(result.data) ||
            "We could not complete the payment.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { ...asRecord(result.data), success: true, messageId },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to complete the payment";
    console.error("[ethioairlines/confirm] threw", { messageId, message });
    return NextResponse.json(
      { success: false, messageId, message },
      { status: 502 }
    );
  }
}
