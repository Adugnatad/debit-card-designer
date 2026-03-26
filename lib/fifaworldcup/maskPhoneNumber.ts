/**
 * Masks a phone for OTP UI hints: leading `09` (local prefix) + stars + last 4 digits.
 */
export function maskPhoneForOtpHint(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) {
    return "09****";
  }
  const last4 = digits.slice(-4);
  const hidden = digits.length - 4;
  return `09${"*".repeat(hidden)}${last4}`;
}
