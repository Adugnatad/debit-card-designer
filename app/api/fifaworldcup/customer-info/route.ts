import { NextRequest, NextResponse } from "next/server";
import {
  customerDetailsFromNormalized,
  extractCustomerDetailsPayload,
} from "@/lib/fifaworldcup/cardRequestUtils";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";
import { runFifaCustomerInfoStep } from "@/lib/fifaworldcup/requestNewCardService";

export const dynamic = "force-dynamic";

type CustomerInfoErrorBody = {
  success: false;
  step: "validation" | "auth" | "customer";
  error: string;
};

function maskValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("@")) {
    const [name, domain] = trimmed.split("@");
    if (!domain) return "***";
    const safeName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
    return `${safeName}@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 7) {
    return trimmed.replace(/\d(?=\d{4})/g, "*");
  }
  if (trimmed.length <= 2) return "*".repeat(trimmed.length);
  return `${trimmed.slice(0, 2)}***`;
}

function maskCustomerDetailsForResponse(
  details: Record<string, unknown>
): Record<string, unknown> {
  const keepRaw = new Set([
    "accountId",
    "accountNumber",
    "categoryId",
    "companyReference",
    "CompanyReference",
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (keepRaw.has(k)) {
      out[k] = v;
      continue;
    }
    out[k] = maskValue(v);
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("accountId")?.trim() ?? "";
    const accountNumber = raw.replace(/\D/g, "").slice(0, 13);

    if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          success: false,
          step: "validation",
          error: "Invalid or missing accountId (need 13 digits).",
        } satisfies CustomerInfoErrorBody,
        { status: 400 }
      );
    }

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
      console.error("[FIFA card] customer-info route: token failed", authErr);
      return NextResponse.json(
        {
          success: false,
          step: "auth",
          error: msg || "Could not obtain access token",
        } satisfies CustomerInfoErrorBody,
        { status: 502 }
      );
    }

    const result = await runFifaCustomerInfoStep(accountNumber, access_token);

    if (!result.ok) {
      const msg =
        (result.message && String(result.message).trim()) ||
        "Customer lookup failed";
      console.warn("[FIFA card] customer-info route failed", {
        step: result.step,
        message: msg,
      });
      return NextResponse.json(
        {
          success: false,
          step: "customer",
          error: msg,
        } satisfies CustomerInfoErrorBody,
        { status: 422 }
      );
    }

    const customerDetails =
      extractCustomerDetailsPayload(result.gatewayData) ??
      customerDetailsFromNormalized(result.normalized);

    return NextResponse.json({
      success: true,
      customerDetails: maskCustomerDetailsForResponse(customerDetails),
    });
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.message.trim()
        ? e.message
        : "Unexpected server error";
    console.error("[FIFA card] customer-info route exception", e);
    return NextResponse.json(
      {
        success: false,
        step: "customer",
        error: message,
      } satisfies CustomerInfoErrorBody,
      { status: 502 }
    );
  }
}
