import { NextResponse } from "next/server";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";

export const dynamic = "force-dynamic";

/**
 * Issues OAuth2 client-credentials token for FIFA World Cup UI only.
 * Proxies credentials server-side; client receives bearer token + expiry.
 */
export async function GET() {
  try {
    const { access_token, expires_in, token_type } =
      await getFifaWorldCupAccessToken();
    return NextResponse.json(
      {
        access_token,
        expires_in,
        token_type: token_type ?? "Bearer",
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to obtain FIFA World Cup token";
    return NextResponse.json({ message }, { status: 502 });
  }
}
