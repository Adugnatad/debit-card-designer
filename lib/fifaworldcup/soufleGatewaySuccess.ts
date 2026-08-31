/**
 * Soufle gateway often returns HTTP 200 with a JSON body; logical failure uses
 * `success: false`, an `error` object, or a bare `message` (e.g. gateway bugs).
 */
export function isSoufleGatewayLogicalFailure(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.raw === "string") {
    return true;
  }
  if (o.success === false) {
    return true;
  }
  if (o.success === true) {
    return false;
  }
  if (typeof o.message === "string" && o.message.trim() !== "") {
    return true;
  }
  if (o.error != null) {
    return true;
  }
  return false;
}

/** Card management `newCardRequest` API: HTTP 200 + `ResponseType: Success` + `newCardResponse` object. */
export function isCardManagementNewCardSuccess(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  const o = data as Record<string, unknown>;
  const rt = o.ResponseType;
  if (typeof rt !== "string" || rt.trim().toLowerCase() !== "success") {
    return false;
  }
  const ncr = o.newCardResponse;
  return ncr !== null && typeof ncr === "object" && !Array.isArray(ncr);
}
