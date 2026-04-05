import { NextResponse } from "next/server";
import { isAsmAllowedResponseStatus } from "@/lib/branches/asmAllowedStatus";

export const dynamic = "force-dynamic";

const DEFAULT_UPSTREAM =
  "https://coopengage.coopbankoromiasc.com/api/branches";

/** Some upstreams / WAFs reject requests without a normal User-Agent. */
const UPSTREAM_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (compatible; CoopCardBranchProxy/1.0; +https://mycard.coopbankoromiasc.com)",
};

function upstreamUrl(): string {
  return (
    process.env.BRANCH_LIST_UPSTREAM_URL?.trim() || DEFAULT_UPSTREAM
  );
}

function upstreamTimeoutMs(): number {
  const raw = process.env.BRANCH_LIST_UPSTREAM_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.min(n, 120_000);
  return 30_000;
}

/**
 * GET — server-side proxy to the bank branch list.
 * Only HTTP statuses allowed by BIG-IP ASM defaults are returned to the client;
 * any other upstream status is mapped to 503.
 */
export async function GET() {
  const url = upstreamUrl();
  let upstream: Response;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), upstreamTimeoutMs());
    try {
      upstream = await fetch(url, {
        method: "GET",
        headers: UPSTREAM_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(t);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "";
    console.error("[branches proxy] upstream fetch failed", {
      url,
      name,
      message: msg,
    });
    return NextResponse.json(
      { error: "Branch list service unreachable" },
      { status: 503 }
    );
  }

  const status = upstream.status;
  const bodyText = await upstream.text();
  const contentType =
    upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
    "application/json";

  if (!isAsmAllowedResponseStatus(status)) {
    console.warn("[branches proxy] upstream status not ASM-allowed, returning 503", status);
    return NextResponse.json(
      { error: "Unable to load branch list" },
      { status: 503 }
    );
  }

  return new NextResponse(bodyText, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
