/**
 * Helpers shared by the Ethio Airlines route handlers. The fifaworldcup routes
 * repeat these inline in each file; they are centralized here.
 */

import type { NextRequest } from "next/server";

/** Probes the usual gateway error-message keys, then `error`. */
export function messageFromGatewayData(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") return data.slice(0, 500);
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of [
    "message",
    "error_description",
    "errorMessage",
    "detail",
  ]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const err = o.error;
  if (typeof err === "string" && err.trim()) return err.trim();
  return null;
}

/** Extracts a client-supplied bearer, if any, to forward as `preferredAccessToken`. */
export function readClientBearer(req: NextRequest): string | undefined {
  const authHeader = req.headers.get("authorization");
  return typeof authHeader === "string" && /^Bearer\s+\S/i.test(authHeader)
    ? authHeader.replace(/^Bearer\s+/i, "").trim()
    : undefined;
}

/** Only pass through a sane upstream status; anything else becomes a 502. */
export function upstreamStatus(status: number): number {
  return status >= 400 && status < 600 ? status : 502;
}

export function asRecord(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}

/** Masks all but the last four digits, matching requestNewCardService.ts:429. */
export function maskAccountForLog(account: string): string {
  return account.replace(/\d(?=\d{4})/g, "*");
}

/** Never log a checkout key in full -- it is a bearer credential for the booking. */
export function truncateKeyForLog(key: string): string {
  return key.length <= 8 ? "…" : `${key.slice(0, 8)}…(${key.length})`;
}
