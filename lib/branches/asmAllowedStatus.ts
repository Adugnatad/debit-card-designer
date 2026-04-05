/**
 * BIG-IP ASM default pass-through HTTP response codes (informational, success,
 * redirect ranges, plus 400, 401, 404, 407, 417, 503).
 * Upstream statuses outside this set must not be forwarded to the client.
 */
export function isAsmAllowedResponseStatus(status: number): boolean {
  if (status >= 100 && status <= 199) return true;
  if (status >= 200 && status <= 299) return true;
  if (status >= 300 && status <= 399) return true;
  return [400, 401, 404, 407, 417, 503].includes(status);
}
