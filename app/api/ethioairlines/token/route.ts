import { NextResponse } from "next/server";
import { getEthioAirlinesAccessToken } from "@/lib/ethioairlines/oauthToken";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getEthioAirlinesAccessToken();
    return NextResponse.json(token, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to obtain access token";
    return NextResponse.json({ message }, { status: 502 });
  }
}
