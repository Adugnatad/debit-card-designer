import { NextResponse } from "next/server";
import { clientIpForShadowLogging } from "./rateLimit";
import { CLIENT_MESSAGE } from "./routeHelpers";

/** Bodies here are a few hundred bytes; anything larger is not a real client. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Shared front door for the checkout routes.
 *
 * Note this CANNOT live in middleware.js -- its matcher excludes /api, and it
 * runs on Edge where node:crypto is unavailable. Keep it here.
 */
export function guardRequest(req: Request, op: string): NextResponse | null {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, message: CLIENT_MESSAGE.badLink },
      { status: 413 }
    );
  }

  // Rejects a cross-site page scripting these endpoints. Deliberately NOT
  // claimed as CSRF protection: there is no ambient credential in this flow
  // (no cookies), and curl omits Origin entirely, so this filters lazy abuse
  // and nothing more. The session handle and rate limits do the real work.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const host = req.headers.get("host");
      if (new URL(origin).host !== host) {
        return NextResponse.json(
          { success: false, message: CLIENT_MESSAGE.unavailable },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, message: CLIENT_MESSAGE.unavailable },
        { status: 403 }
      );
    }
  }

  // Shadow-mode only: record the header chain so the trusted hop count can be
  // determined from real traffic before per-IP limits are ever enforced.
  const ip = clientIpForShadowLogging(req.headers);
  if (ip.xff || ip.xRealIp) {
    console.log("[ethioairlines/ip-shadow]", { op, ...ip });
  }

  return null;
}
