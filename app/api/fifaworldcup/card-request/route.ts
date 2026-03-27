import { NextRequest, NextResponse } from "next/server";
import type {
  CardRequestBranchPayload,
  RequestNewCardGatewayBody,
} from "@/lib/fifaworldcup/cardRequestTypes";
import { postFifaRequestNewCard } from "@/lib/fifaworldcup/cardRequestGateway";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";
import { requestNewCardFlowServer } from "@/lib/fifaworldcup/requestNewCardService";
import { isSoufleGatewayLogicalFailure } from "@/lib/fifaworldcup/soufleGatewaySuccess";

export const dynamic = "force-dynamic";

/**
 * POST `requestNewCard` to the gateway. If the JSON body includes `customerDetails`
 * (same object as `GET /api/fifaworldcup/customer-info`), that object is used to build
 * the prepaid payload and the server skips a second GET to customer/info. Otherwise
 * the server fetches customer/info once, then posts.
 */

type CardRequestResponse = {
  success: boolean;
  step: "validation" | "auth" | "customer" | "fund" | "card" | "server" | "ok";
  error: string;
  details?: unknown;
};

function toGatewayBody(
  body: Record<string, unknown>
): RequestNewCardGatewayBody | null {
  const keys: Array<keyof RequestNewCardGatewayBody> = [
    "MsgUid",
    "CustomerCode",
    "Title",
    "FirstName",
    "LastName",
    "IdNumber",
    "DateOfBirth",
    "MaritalStatus",
    "Gender",
    "AddressLine1",
    "City",
    "PostalCode",
    "Region",
    "Phone1",
    "Email",
    "District",
    "CurrCode",
    "BranchCode",
    "CardProduct",
    "EmbossingName",
    "CustomerIdNumber",
    "ExtendedCustomerIdNumber",
  ];
  const out = {} as RequestNewCardGatewayBody;
  for (const k of keys) {
    const v = body[k];
    if (typeof v !== "string") return null;
    out[k] = v;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const directGatewayBody = toGatewayBody(body);

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

    if (directGatewayBody) {
      const cardRes = await postFifaRequestNewCard(directGatewayBody, access_token);
      if (!cardRes.ok || isSoufleGatewayLogicalFailure(cardRes.data)) {
        if (cardRes.data && typeof cardRes.data === "object") {
          return NextResponse.json(cardRes.data, { status: 422 });
        }
        return NextResponse.json(
          {
            success: false,
            step: "card",
            error: "Card request failed",
            details: cardRes.data,
          } satisfies CardRequestResponse,
          { status: 422 }
        );
      }
      return NextResponse.json(
        cardRes.data && typeof cardRes.data === "object"
          ? cardRes.data
          : { success: true }
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

    const rawDetails = body.customerDetails;
    let customerDetails: Record<string, unknown> | undefined;
    if (
      rawDetails !== null &&
      rawDetails !== undefined &&
      typeof rawDetails === "object" &&
      !Array.isArray(rawDetails)
    ) {
      customerDetails = rawDetails as Record<string, unknown>;
    }

    const result = await requestNewCardFlowServer(
      {
        accountNumber,
        branch: branchPayload,
        ...(customerDetails ? { customerDetails } : {}),
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
      if (result.data && typeof result.data === "object") {
        return NextResponse.json(result.data, { status: 422 });
      }
      return NextResponse.json(
        {
          success: false,
          step: result.step,
          error: msg,
        } satisfies CardRequestResponse,
        { status: 422 }
      );
    }

    return NextResponse.json(
      result.data && typeof result.data === "object"
        ? result.data
        : { success: true }
    );
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
