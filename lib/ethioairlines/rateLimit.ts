/**
 * In-memory sliding-window rate limiting.
 *
 * Same per-process pattern as the OAuth token cache. Correct for the current
 * single-process deployment; with several instances the effective limit
 * multiplies by instance count. Swapping to Postgres later touches only this
 * file -- callers see `hit()` either way.
 */

const MAX_BUCKETS = 10_000;
const SWEEP_EVERY = 64;

type Bucket = number[];

/**
 * Pinned to globalThis for the same reason as the session store: a per-route
 * module instance would give each route its own buckets, silently multiplying
 * every limit by the number of instances.
 */
const globalStore = globalThis as unknown as {
  __ethioRateBuckets?: Map<string, Bucket>;
  __ethioRateWrites?: number;
};
const buckets: Map<string, Bucket> =
  globalStore.__ethioRateBuckets ??
  (globalStore.__ethioRateBuckets = new Map<string, Bucket>());
let writesSinceSweep = globalStore.__ethioRateWrites ?? 0;

/**
 * Sweep is amortized, not per-write. Bucket keys are partly attacker-influenced
 * (a spoofed IP header creates a new key), so an O(n) walk on every request
 * would itself be the amplification.
 */
function maybeSweep(now: number, windowMs: number): void {
  writesSinceSweep += 1;
  globalStore.__ethioRateWrites = writesSinceSweep;
  if (writesSinceSweep < SWEEP_EVERY && buckets.size <= MAX_BUCKETS) return;
  writesSinceSweep = 0;
  globalStore.__ethioRateWrites = 0;

  for (const [key, hits] of buckets) {
    const live = hits.filter((t) => now - t < windowMs);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }

  // Hard cap even after sweeping: drop the least recently active buckets.
  if (buckets.size > MAX_BUCKETS) {
    const byLastHit = [...buckets.entries()].sort(
      (a, b) => (a[1].at(-1) ?? 0) - (b[1].at(-1) ?? 0)
    );
    for (const [key] of byLastHit.slice(0, buckets.size - MAX_BUCKETS)) {
      buckets.delete(key);
    }
  }
}

export type RateVerdict = {
  allowed: boolean;
  /** Seconds until the oldest hit in the window falls out. */
  retryAfterSec: number;
  count: number;
};

export function hit(
  key: string,
  limit: number,
  windowMs: number
): RateVerdict {
  const now = Date.now();
  maybeSweep(now, windowMs);

  const live = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  live.push(now);
  buckets.set(key, live);

  const allowed = live.length <= limit;
  const oldest = live[0] ?? now;
  return {
    allowed,
    retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    count: live.length,
  };
}

/**
 * Limits are deliberately above what the UI can legitimately produce. The OTP
 * step allows a resend every 60s inside a 180s window, so a real user can send
 * at t=0/60/120 -- a 3-per-15-minutes budget would 429 a genuine fourth attempt
 * after a failed SMS.
 */
export const LIMITS = {
  sendOtpPerAccount: { limit: 5, windowMs: 15 * 60_000 },
  confirmPerKey: { limit: 5, windowMs: 15 * 60_000 },
  perIp: { limit: 30, windowMs: 5 * 60_000 },
} as const;

/**
 * Client IP for SHADOW logging only -- do not gate on this yet.
 *
 * `x-forwarded-for[0]` is client-spoofable, so enforcing on it is both
 * bypassable and a weapon (spoof a victim's IP to burn their bucket). And this
 * app sits behind nginx *and* an upstream TLS-terminating LB: unless nginx has
 * `set_real_ip_from <LB CIDR>`, the value it reports is one constant for every
 * user, which would turn a per-IP limit into a global one and lock out the
 * whole customer base. Ethio Telecom CGNAT means many real users share an
 * egress IP even in the best case.
 *
 * Log the real chain first, work out the trusted hop count, THEN enforce.
 */
export function clientIpForShadowLogging(headers: Headers): {
  xff: string | null;
  xRealIp: string | null;
} {
  return {
    xff: headers.get("x-forwarded-for"),
    xRealIp: headers.get("x-real-ip"),
  };
}
