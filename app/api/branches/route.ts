import { NextResponse } from "next/server";

/** Upstream branch list API (server-side only). Override with BRANCH_BACKEND_BASE_URL. */
const DEFAULT_UPSTREAM = "https://coopengage.coopbankoromiasc.com";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (
    process.env.BRANCH_BACKEND_BASE_URL?.trim() || DEFAULT_UPSTREAM
  ).replace(/\/$/, "");
  const url = `${base}/api/branches`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Upstream branches request failed",
          upstreamStatus: res.status,
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    let data: unknown;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from upstream branches API" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Branch proxy request failed";
    console.error("[branches proxy]", message, e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
