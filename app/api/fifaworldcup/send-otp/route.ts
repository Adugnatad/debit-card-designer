import { NextRequest, NextResponse } from "next/server";
import { sendFifaWorldCupOtp } from "@/lib/fifaworldcup/sendOtp";
import { isSoufleGatewayLogicalFailure } from "@/lib/fifaworldcup/soufleGatewaySuccess";

export const dynamic = "force-dynamic";

function messageFromGatewayData(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") return data.slice(0, 500);
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of ["message", "error_description", "errorMessage", "detail"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const err = o.error;
  if (typeof err === "string" && err.trim()) return err.trim();
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      accountNumber?: unknown;
    };
    const accountNumber =
      typeof body.accountNumber === "string"
        ? body.accountNumber.trim().replace(/\D/g, "").slice(0, 13)
        : "";

    if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
      return NextResponse.json(
        { message: "Please enter a valid 13-digit account number." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const clientBearer =
      typeof authHeader === "string" && /^Bearer\s+\S/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, "").trim()
        : undefined;

    const result = await sendFifaWorldCupOtp(
      accountNumber,
      clientBearer || undefined
    );

    if (!result.ok) {
      const msg =
        messageFromGatewayData(result.data) ||
        `Unable to send OTP (${result.status})`;
      return NextResponse.json(
        { success: false, message: msg, details: result.data },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      );
    }

    if (isSoufleGatewayLogicalFailure(result.data)) {
      return NextResponse.json(
        { success: false },
        { status: 422 }
      );
    }

    const payload =
      result.data && typeof result.data === "object" && !Array.isArray(result.data)
        ? (result.data as Record<string, unknown>)
        : {};
    const phone =
      typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";
    if (!phone) {
      return NextResponse.json({ success: false }, { status: 422 });
    }

    return NextResponse.json(
      result.data && typeof result.data === "object"
        ? result.data
        : { success: true },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to send OTP";
    return NextResponse.json({ message }, { status: 502 });
  }
}
