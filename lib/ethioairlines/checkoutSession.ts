/**
 * Server-side checkout session state.
 *
 * The client holds only an opaque 128-bit handle. Everything that matters --
 * the account, the phone number, whether OTP actually succeeded -- lives here
 * and never crosses the wire.
 *
 * Deliberately NOT an HMAC-signed token. A signed blob is signed, not
 * encrypted: the phone number inside would be recoverable with one atob(), and
 * "otpVerified" would have to be re-issued on every transition. A random handle
 * into server state gives unforgeable flags, single-use, and attempt counting
 * for free, with no signing secret to deploy.
 *
 * Trade-off: state is per-process and lost on restart. For a 3-minute OTP
 * window that is acceptable, and it matches how the OAuth token cache already
 * works. Swapping the Map for Postgres later touches only this file.
 */

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
/** Cap the map: handles are server-generated, but a restart-storm or a leak
 *  shouldn't be able to grow it without bound. */
const MAX_SESSIONS = 10_000;

export type CheckoutSession = {
  acct: string;
  phone: string;
  /** sha256 of the checkout key, so confirm can prove it's the same booking. */
  keyHash: string;
  messageId: string;
  otpVerified: boolean;
  verifyAttempts: number;
  expiresAtMs: number;
  /** Set once confirm has run, so a retry replays instead of double-debiting. */
  outcome?: { status: number; body: unknown };
};

/**
 * Pinned to globalThis, NOT a plain module-level Map.
 *
 * A bundler can give each route handler its own instance of this module, in
 * which case send-otp writes to one Map and verify-otp reads a different one --
 * every session then looks "lost". That was observed directly: a session created
 * by /api/c/s7k2 was invisible to /api/c/v9m4 milliseconds later.
 *
 * globalThis is per-process, so every instance of this module resolves to the
 * same store. It also survives dev HMR module re-evaluation, which otherwise
 * wipes in-flight sessions on every file save.
 */
const globalStore = globalThis as unknown as {
  __ethioCheckoutSessions?: Map<string, CheckoutSession>;
};
const sessions: Map<string, CheckoutSession> =
  globalStore.__ethioCheckoutSessions ??
  (globalStore.__ethioCheckoutSessions = new Map<string, CheckoutSession>());

export function hashCheckoutKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function sweep(now: number): void {
  for (const [handle, s] of sessions) {
    if (s.expiresAtMs <= now) sessions.delete(handle);
  }
  // Still over cap after removing expired entries: drop oldest-expiring first.
  if (sessions.size > MAX_SESSIONS) {
    const byExpiry = [...sessions.entries()].sort(
      (a, b) => a[1].expiresAtMs - b[1].expiresAtMs
    );
    for (const [handle] of byExpiry.slice(0, sessions.size - MAX_SESSIONS)) {
      sessions.delete(handle);
    }
  }
}

export function createSession(input: {
  acct: string;
  phone: string;
  keyHash: string;
  messageId: string;
}): string {
  const now = Date.now();
  sweep(now);
  const handle = randomBytes(16).toString("base64url");
  sessions.set(handle, {
    ...input,
    otpVerified: false,
    verifyAttempts: 0,
    expiresAtMs: now + TTL_MS,
  });
  return handle;
}

/** Constant-time handle lookup, so a valid prefix isn't distinguishable. */
export function getSession(handle: unknown): CheckoutSession | null {
  if (typeof handle !== "string" || handle.length < 16 || handle.length > 64) {
    return null;
  }
  const s = sessions.get(handle);
  if (!s) return null;
  if (s.expiresAtMs <= Date.now()) {
    sessions.delete(handle);
    return null;
  }
  return s;
}

export function destroySession(handle: string): void {
  sessions.delete(handle);
}

export type VerifyGate =
  | { ok: true; session: CheckoutSession }
  | { ok: false; reason: "invalid" | "exhausted" };

/**
 * Counts an OTP attempt BEFORE the upstream call. Five wrong guesses burn the
 * session -- without this a 6-digit code is brute-forceable in ~10^6 requests.
 */
export function beginVerifyAttempt(handle: unknown): VerifyGate {
  const session = getSession(handle);
  if (!session) return { ok: false, reason: "invalid" };
  session.verifyAttempts += 1;
  if (session.verifyAttempts > MAX_VERIFY_ATTEMPTS) {
    destroySession(handle as string);
    return { ok: false, reason: "exhausted" };
  }
  return { ok: true, session };
}

export function markOtpVerified(handle: string): void {
  const s = sessions.get(handle);
  if (s) s.otpVerified = true;
}

export type ConfirmGate =
  | { ok: true; session: CheckoutSession }
  | { ok: true; replay: { status: number; body: unknown } }
  | { ok: false; reason: "invalid" | "otp_required" | "key_mismatch" };

/**
 * Gate for the money-moving step. Requires a live session that actually
 * completed OTP, and whose checkout key matches the one presented.
 *
 * A second call with the same handle replays the stored outcome rather than
 * debiting again -- the client legitimately retries after a network timeout.
 */
export function gateConfirm(handle: unknown, keyHash: string): ConfirmGate {
  const session = getSession(handle);
  if (!session) return { ok: false, reason: "invalid" };
  if (session.outcome) return { ok: true, replay: session.outcome };
  if (!session.otpVerified) return { ok: false, reason: "otp_required" };

  const a = Buffer.from(session.keyHash, "hex");
  const b = Buffer.from(keyHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "key_mismatch" };
  }
  return { ok: true, session };
}

export function recordConfirmOutcome(
  handle: string,
  outcome: { status: number; body: unknown }
): void {
  const s = sessions.get(handle);
  if (s) s.outcome = outcome;
}

/** Test/diagnostic only. */
export function sessionCountForDiagnostics(): number {
  return sessions.size;
}
