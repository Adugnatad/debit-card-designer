/**
 * Helpers shared by the Ethio Airlines route handlers. The fifaworldcup routes
 * repeat these inline in each file; they are centralized here.
 */

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

/**
 * Fixed client-facing messages. Upstream gateway text is deliberately NOT
 * forwarded: it distinguishes "account not found" from "account dormant", and
 * raw `e.message` names internal hosts and env vars. Detail is logged instead.
 */
export const CLIENT_MESSAGE = {
  badAccount: "Please enter a valid 13-digit account number.",
  badLink: "This payment link is invalid or incomplete.",
  /** Distinct from badLink on purpose: an expired link is a normal thing that
   *  happens to legitimate customers, and telling them to start again is more
   *  useful than implying the link was malformed. Not an information leak --
   *  whoever sends this already holds the key and can read its own expiry. */
  linkExpired: "This payment link has expired. Please start again from Ethiopian Airlines.",
  badCode: "Enter the 6-digit verification code.",
  /** One message for unknown account, no registered phone, and upstream
   *  logical failure -- three distinct replies were an enumeration oracle. */
  otpNotSent: "We could not send a verification code for that account.",
  otpRejected: "That code is incorrect or has expired.",
  /** Distinct from otpRejected: the code may be perfectly correct, but the
   *  server-side session is gone (10-min TTL, or a deploy/restart cleared the
   *  in-memory store). Telling the user the code is wrong makes them retype a
   *  correct code and fail again. */
  sessionLost: "Your session has timed out. Please start again.",
  confirmFailed: "We could not complete the payment.",
  unavailable: "Service is temporarily unavailable. Please try again.",
} as const;

/** Whitelist of upstream confirm fields the UI actually reads. */
export function pickConfirmFields(data: unknown) {
  const o = asRecord(data);
  const str = (v: unknown) =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;
  return {
    transactionRef: str(o.transactionRef) ?? str(o.transactionId),
    amount: str(o.amount),
    redirectUrl: str(o.redirectUrl) ?? str(o.returnUrl),
  };
}

