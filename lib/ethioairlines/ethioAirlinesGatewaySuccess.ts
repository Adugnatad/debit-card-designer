/**
 * The APIM gateway family returns HTTP 200 for logical failures, so `res.ok` is
 * never sufficient. Two detectors, because the two endpoint families differ in
 * how much we know about their success bodies.
 */

function asRecord(data: unknown): Record<string, unknown> | null {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  return data as Record<string, unknown>;
}

/**
 * sendOtp / verifyOtp -- STRICT. Both are documented to return an explicit
 * `success` boolean, so an absent one is treated as a failure.
 */
export function isEthioAirlinesLogicalFailure(data: unknown): boolean {
  const o = asRecord(data);
  if (!o) return true;
  if (typeof o.raw === "string") return true;
  if (o.success === false) return true;
  if (o.success === true) return false;
  if (typeof o.message === "string" && o.message.trim() !== "") return true;
  if (o.error != null) return true;
  return true;
}

const FAILURE_WORDS = new Set(["failed", "failure", "error", "business error"]);

/**
 * confirm -- LENIENT. The success body is not yet documented, so this fails only
 * on explicit failure signals. A confirm that returns just
 * `{ message: "Payment confirmed" }` must not be misread as a failure, which the
 * strict rule above would do.
 *
 * Tighten this once a real success and a real failure sample are in hand.
 */
export function isEthioAirlinesConfirmFailure(data: unknown): boolean {
  const o = asRecord(data);
  if (!o) return true;
  if (typeof o.raw === "string") return true;
  if (o.success === false) return true;
  if (o.error != null) return true;

  for (const key of ["ResponseType", "status", "Status"]) {
    const v = o[key];
    if (typeof v === "string" && FAILURE_WORDS.has(v.trim().toLowerCase())) {
      return true;
    }
  }

  return false;
}
