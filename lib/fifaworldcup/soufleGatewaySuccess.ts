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
