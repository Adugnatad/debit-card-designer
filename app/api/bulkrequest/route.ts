import { NextRequest, NextResponse } from "next/server";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";
import { processBulkRows } from "@/lib/bulkrequest/bulkRequestService";
import type {
  BulkInputRow,
  BulkProcessResponse,
} from "@/lib/bulkrequest/bulkRequestTypes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          step: "validation",
          error: "Request body must be a JSON array",
        } satisfies BulkProcessResponse,
        { status: 400 }
      );
    }

    const rows = body as BulkInputRow[];
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          step: "validation",
          error: "Request array must not be empty",
        } satisfies BulkProcessResponse,
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const clientBearer =
      typeof authHeader === "string" && /^Bearer\s+\S/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, "").trim()
        : undefined;

    let accessToken: string;
    try {
      accessToken = clientBearer || (await getFifaWorldCupAccessToken()).access_token;
    } catch (authErr: unknown) {
      const msg = authErr instanceof Error ? authErr.message : "OAuth token failed";
      return NextResponse.json(
        {
          success: false,
          step: "auth",
          error: msg || "Could not obtain access token",
        } satisfies BulkProcessResponse,
        { status: 502 }
      );
    }

    const rowResults = await processBulkRows(rows, accessToken);
    const ok = rowResults.filter((r) => r.status === "ok").length;
    const failed = rowResults.length - ok;

    return NextResponse.json({
      success: true,
      summary: {
        total: rowResults.length,
        ok,
        failed,
      },
      rows: rowResults,
    } satisfies BulkProcessResponse);
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.message.trim()
        ? e.message
        : "Unexpected server error";
    return NextResponse.json(
      {
        success: false,
        step: "server",
        error: message,
      } satisfies BulkProcessResponse,
      { status: 502 }
    );
  }
}
