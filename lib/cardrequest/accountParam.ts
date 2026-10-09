/** Prefill from `?account=1010...` or `?account="1010..."`; anything else is ignored. */
export function normalizeAccountParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  const digits = raw.replace(/['"]/g, "").replace(/\D/g, "").slice(0, 13);
  return /^\d{13}$/.test(digits) ? digits : "";
}
