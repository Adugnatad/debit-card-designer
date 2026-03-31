import { NextRequest, NextResponse } from "next/server";
import type { CardRequestBranchPayload } from "@/lib/fifaworldcup/cardRequestTypes";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";
import { requestNewCardFlowServer } from "@/lib/fifaworldcup/requestNewCardService";

export const dynamic = "force-dynamic";

/**
 * POST to gateway `newCardRequest`. If the JSON body includes `customerDetails`
 * (same object as `GET /api/fifaworldcup/customer-info`), that object is used to build
 * the payload and the server skips a second GET to customer/info. Otherwise
 * the server fetches customer/info once, then posts.
 */

type CardRequestResponse = {
  success: boolean;
  step:
    | "validation"
    | "auth"
    | "customer"
    | "fund"
    | "card"
    | "cbs"
    | "server"
    | "ok";
  error: string;
  details?: unknown;
};

function messageFromUnknown(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  if (typeof data === "string" && data.trim()) return data.trim().slice(0, 500);
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of [
    "ResponseDescription",
    "message",
    "error_description",
    "errorMessage",
    "detail",
    "error",
  ]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 500);
  }
  return null;
}

function responseCodeOf(data: unknown): string | null {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return null;
  const v = (data as Record<string, unknown>).ResponseCode;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function isAlreadyHasCardError(data: unknown): boolean {
  if (responseCodeOf(data) === "CD012") return true;
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const o = data as Record<string, unknown>;
  const rt =
    typeof o.ResponseType === "string" ? o.ResponseType.trim().toLowerCase() : "";
  const desc =
    typeof o.ResponseDescription === "string"
      ? o.ResponseDescription.toLowerCase()
      : "";
  if (rt !== "business error") return false;
  return (
    desc.includes("maximum number") ||
    desc.includes("exceeded") ||
    desc.includes("primary cards")
  );
}

function statusForGatewayCardFailure(data: unknown): number {
  if (isAlreadyHasCardError(data)) return 503;
  return 417;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const authHeader = req.headers.get("authorization");
    const clientBearer =
      typeof authHeader === "string" && /^Bearer\s+\S/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, "").trim()
        : undefined;

    let access_token: string;
    try {
      access_token =
        clientBearer || (await getFifaWorldCupAccessToken()).access_token;
    } catch (authErr: unknown) {
      const msg =
        authErr instanceof Error ? authErr.message : "OAuth token failed";
      console.error("[FIFA card] card-request route: token failed", authErr);
      return NextResponse.json(
        {
          success: false,
          step: "auth",
          error: msg || "Could not obtain access token",
        } satisfies CardRequestResponse,
        { status: 502 }
      );
    }

    const accountNumber =
      typeof body.accountNumber === "string"
        ? body.accountNumber.trim().replace(/\D/g, "").slice(0, 13)
        : "";

    if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          success: false,
          step: "validation",
          error: "Invalid account number (need 13 digits).",
        } satisfies CardRequestResponse,
        { status: 400 }
      );
    }

    const branchId = Number(body.branchId);
    const branchCode =
      typeof body.branchCode === "string"
        ? body.branchCode.trim()
        : String(body.branchCode ?? "").trim();

    if (!Number.isFinite(branchId) || branchId <= 0 || !branchCode) {
      return NextResponse.json(
        {
          success: false,
          step: "validation",
          error: "Invalid branch: need branchId and branchCode.",
        } satisfies CardRequestResponse,
        { status: 400 }
      );
    }

    const district =
      body.district === null || body.district === undefined
        ? null
        : String(body.district).trim() || null;

    const branchPayload: CardRequestBranchPayload = {
      branchId,
      branchCode,
      district,
    };

    const result = await requestNewCardFlowServer(
      {
        accountNumber,
        branch: branchPayload,
      },
      access_token
    );

    if (!result.ok) {
      const msg =
        (result.message && String(result.message).trim()) ||
        `Failed at step: ${result.step}`;
      console.warn("[FIFA card] card-request route pipeline failed", {
        step: result.step,
        message: msg,
      });
      const failStatus = statusForGatewayCardFailure(result.data);
      return NextResponse.json(
        {
          success: false,
          step: result.step,
          error: messageFromUnknown(result.data) || msg,
        } satisfies CardRequestResponse,
        { status: failStatus }
      );
    }

    return NextResponse.json({ success: true, step: "ok" }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.message.trim()
        ? e.message
        : "Unexpected server error";
    console.error("[FIFA card] card-request route exception", e);
    return NextResponse.json(
      {
        success: false,
        step: "server",
        error: message,
      } satisfies CardRequestResponse,
      { status: 502 }
    );
  }
}
