import { NextRequest, NextResponse } from "next/server";
import { getFifaWorldCupAccessToken } from "@/lib/fifaworldcup/oauthToken";
import {
  processBulkRecords,
  type BulkInputRecord,
} from "@/lib/fifaworldcup/bulkRequestService";

export const dynamic = "force-dynamic";

type BulkRouteResponse = {
  success: boolean;
  message?: string;
  results?: unknown[];
  total?: number;
  successCount?: number;
  failureCount?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const recordsRaw = body.records;
    if (!Array.isArray(recordsRaw)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload: `records` must be an array.",
        } satisfies BulkRouteResponse,
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
      accessToken =
        clientBearer || (await getFifaWorldCupAccessToken()).access_token;
    } catch (authErr: unknown) {
      const msg =
        authErr instanceof Error ? authErr.message : "OAuth token failed";
      console.error("[bulk card] token failed", authErr);
      return NextResponse.json(
        {
          success: false,
          message: msg || "Could not obtain access token",
        } satisfies BulkRouteResponse,
        { status: 502 }
      );
    }

    const records = recordsRaw as BulkInputRecord[];
    const results = await processBulkRecords({
      records,
      preferredAccessToken: accessToken,
    });
    const successCount = results.filter((r) => r.status === "SUCCESS").length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      successCount,
      failureCount,
    } satisfies BulkRouteResponse);
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.message.trim()
        ? e.message
        : "Unexpected server error";
    console.error("[bulk card] route exception", e);
    return NextResponse.json(
      {
        success: false,
        message,
      } satisfies BulkRouteResponse,
      { status: 502 }
    );
  }
}
