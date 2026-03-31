import { NextRequest, NextResponse } from "next/server";
import { verifyFifaWorldCupOtp } from "@/lib/fifaworldcup/verifyOtp";
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
      phoneNumber?: unknown;
      otpCode?: unknown;
    };

    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim().replace(/\D/g, "")
        : "";
    const otpRaw =
      typeof body.otpCode === "string"
        ? body.otpCode.trim().replace(/\D/g, "")
        : "";

    if (!phoneNumber) {
      return NextResponse.json(
        { message: "Phone number is missing. Request a new OTP." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otpRaw)) {
      return NextResponse.json(
        { message: "Enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const clientBearer =
      typeof authHeader === "string" && /^Bearer\s+\S/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, "").trim()
        : undefined;

    const result = await verifyFifaWorldCupOtp(
      phoneNumber,
      otpRaw,
      clientBearer || undefined
    );

    if (!result.ok) {
      const msg =
        messageFromGatewayData(result.data) ||
        `Unable to verify OTP (${result.status})`;
      return NextResponse.json(
        { success: false, message: msg },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      );
    }

    if (isSoufleGatewayLogicalFailure(result.data)) {
      return NextResponse.json({ success: false }, { status: 422 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to verify OTP";
    return NextResponse.json({ message }, { status: 502 });
  }
}
