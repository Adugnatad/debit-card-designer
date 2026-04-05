import { NextResponse } from "next/server";
import { isAsmAllowedResponseStatus } from "@/lib/branches/asmAllowedStatus";

export const dynamic = "force-dynamic";

const DEFAULT_UPSTREAM =
  "https://coopengage.coopbankoromiasc.com/api/branches";

function upstreamUrl(): string {
  return (
    process.env.BRANCH_LIST_UPSTREAM_URL?.trim() || DEFAULT_UPSTREAM
  );
}

/**
 * GET — server-side proxy to the bank branch list.
 * Only HTTP statuses allowed by BIG-IP ASM defaults are returned to the client;
 * any other upstream status is mapped to 503.
 */
export async function GET() {
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
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
