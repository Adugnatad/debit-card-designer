/**
 * The `?key=` booking token that Ethiopian Airlines appends to the checkout URL.
 *
 * Treated as OPAQUE: it is passed through verbatim as the `token` field of
 * /confirm. It is decoded here only to surface a booking reference and an
 * advisory expiry in the UI -- the gateway stays authoritative on validity.
 *
 * Observed shape: base64( base64("urn:uuid:<id>...") + "=" + <epoch ms> )
 */

const MAX_KEY_LENGTH = 8192;
const BASE64_CHARS = "A-Za-z0-9+/=_-";
const VALID_KEY_PATTERN = new RegExp(`^[${BASE64_CHARS}]{16,4096}$`);
const EDGE_TRIM_PATTERN = new RegExp(
  `^[^${BASE64_CHARS}]+|[^${BASE64_CHARS}]+$`,
  "g"
);

function firstValue(raw: string | string[] | null | undefined): string | null {
  if (Array.isArray(raw)) {
    return typeof raw[0] === "string" ? raw[0] : null;
  }
  return typeof raw === "string" ? raw : null;
}

function stripEdgeQuotes(value: string): string {
  return value.replace(/^["'`“”]+|["'`“”]+$/g, "");
}

/**
 * Normalizes a raw `?key=` value.
 *
 * Handles, in order: array params, oversized input, surrounding whitespace,
 * stray quotes (the sample URL ends in a literal `%22`), single or double URL
 * encoding, and `+` characters that query-string decoding turned into spaces.
 * Returns "" when nothing usable remains.
 */
export function sanitizeCheckoutKey(
  raw: string | string[] | null | undefined
): string {
  const initial = firstValue(raw);
  if (initial === null) return "";

  let value = initial.slice(0, MAX_KEY_LENGTH);

  // At most two passes: enough for `%22` and the double-encoded `%2522`,
  // bounded so a crafted input cannot drive an unbounded decode loop.
  for (let pass = 0; pass < 2; pass += 1) {
    const before = value;
    value = stripEdgeQuotes(value.trim());

    if (/%[0-9A-Fa-f]{2}/.test(value)) {
      try {
        value = decodeURIComponent(value);
      } catch {
        // A malformed percent sequence must never throw out of the sanitizer.
        break;
      }
    }

    if (value === before) break;
  }

  value = stripEdgeQuotes(value.trim());

  // A `+` inside a query value decodes to a space, which would silently corrupt
  // a base64 payload. Base64 never contains a literal space, so any interior
  // space is a mangled `+`.
  if (value.includes(" ") && !value.includes("+")) {
    value = value.replace(/ /g, "+");
  }
  value = value.replace(/[\r\n\t]/g, "");

  return value.replace(EDGE_TRIM_PATTERN, "");
}

/** Shape gate only -- deliberately does not interpret the payload. */
export function isValidCheckoutKey(key: string): boolean {
  return VALID_KEY_PATTERN.test(key);
}

export type CheckoutKeyStatus = "absent" | "malformed" | "ok";

export type ParsedCheckoutKey = {
  status: CheckoutKeyStatus;
  key: string;
  /** Short display form of the booking uuid, e.g. "7c5ee6c3…91f3". */
  bookingRef: string | null;
  expiresAtMs: number | null;
};

function decodeBase64(value: string): string | null {
  try {
    if (typeof atob === "function") {
      return atob(value);
    }
  } catch {
    return null;
  }
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

const UUID_PATTERN =
  /([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;

/**
 * Best-effort decode for display purposes. Any failure downgrades to a null
 * bookingRef / expiry rather than rejecting the key -- only `isValidCheckoutKey`
 * decides whether the checkout renders at all.
 */
export function parseCheckoutKey(
  raw: string | string[] | null | undefined
): ParsedCheckoutKey {
  const key = sanitizeCheckoutKey(raw);
  if (!key) {
    return { status: "absent", key: "", bookingRef: null, expiresAtMs: null };
  }
  if (!isValidCheckoutKey(key)) {
    return { status: "malformed", key, bookingRef: null, expiresAtMs: null };
  }

  let bookingRef: string | null = null;
  let expiresAtMs: number | null = null;

  const outer = decodeBase64(key);
  if (outer) {
    // Trailing run of digits is the epoch; everything before it is inner base64.
    const split = /^(.*?)(\d{10,16})$/.exec(outer);
    if (split) {
      const parsedEpoch = Number(split[2]);
      if (Number.isFinite(parsedEpoch) && parsedEpoch > 0) {
        expiresAtMs = parsedEpoch;
      }
      const inner = decodeBase64(split[1]);
      const match = inner ? UUID_PATTERN.exec(inner) : null;
      if (match) {
        bookingRef = `${match[1]}…${match[5].slice(-4)}`;
      }
    }
  }

  return { status: "ok", key, bookingRef, expiresAtMs };
}

/** Optional `?account=` prefill, mirroring the fifaworldcup convention. */
export function normalizeAccountParam(
  raw: string | string[] | null | undefined
): string | null {
  const initial = firstValue(raw);
  if (initial === null) return null;
  const digits = initial.replace(/\D/g, "").slice(0, 13);
  return /^\d{13}$/.test(digits) ? digits : null;
}
