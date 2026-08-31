/**
 * Ethio Airlines checkout branding.
 *
 * The supplied logo is the crimson "Ethiopian" wordmark with the green/yellow/red
 * swoosh and the Amharic lockup, 1200x504 with a transparent background. The
 * primary accent is therefore CRIMSON -- green and gold appear only in the swoosh
 * and are used as thin decorative rules, never as button fills.
 *
 * Coop's cyan stays on the stepper: bank chrome on the bank's side of the page,
 * airline crimson on the merchant's side.
 */

export const AIRLINE_NAME = "Ethiopian Airlines";
export const AIRLINE_LOGO_SRC = "/ETHIOPIANAIRLINES/ethiopianalineslogo.png";
export const AIRLINE_LOGO_W = 1200;
export const AIRLINE_LOGO_H = 504;

export const AIRLINE_CRIMSON = "#C8102E";
export const AIRLINE_CRIMSON_DARK = "#A50D26";
export const AIRLINE_GREEN = "#078930";
export const AIRLINE_GOLD = "#FCDD09";

export const COOP_LOGO_SRC = "/CARD-TO-CUP/cooplogo.png";
export const COOP_CYAN = "#00adef";
export const COOP_CYAN_DARK = "#0092c8";
/**
 * Deepened brand cyan for small text on a pale cyan tint. Brand `#00adef` only
 * reaches 2.3:1 there and `#0092c8` 3.2:1 -- both fail AA for text this size.
 * This measures 4.6:1 while staying in the same hue family.
 */
export const COOP_CYAN_TEXT = "#0077a3";
export const BANK_NAME = "Cooperative Bank of Oromia";

/**
 * Interactive chrome -- buttons, focus rings, step headings, the success tick --
 * uses Coop cyan, matching the stepper. The airline's crimson stays on the logo
 * and the swoosh rule only: this is the bank's payment page, with Ethiopian
 * Airlines identified as the merchant.
 */
export const PRIMARY_ACCENT = "rgba(0, 173, 239, 0.8)";
/** Hover goes to full strength rather than darker -- keeps it in the same family. */
export const PRIMARY_ACCENT_DARK = COOP_CYAN;
export const PRIMARY_ACCENT_SOFT = "rgba(0, 173, 239, 0.08)";

export const PAGE_BG = "#f7fbfd";
export const CARD_BORDER = "#e0f2fe";

const DEFAULT_RETURN_URL = "https://www.ethiopianairlines.com/";
const ALLOWED_RETURN_HOSTS = ["ethiopianairlines.com", "coopbankoromiasc.com"];

/**
 * Only ever link to an https URL on an allow-listed host. Rendering an arbitrary
 * URL -- especially one echoed back by an API -- would be an open redirect.
 */
export function safeAirlineUrl(candidate: unknown): string | null {
  if (typeof candidate !== "string" || !candidate.trim()) return null;
  try {
    const url = new URL(candidate.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const allowed = ALLOWED_RETURN_HOSTS.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Confirm response first, then env, then a hardcoded floor -- all allow-listed. */
export function resolveReturnUrl(fromConfirm?: unknown): string {
  return (
    safeAirlineUrl(fromConfirm) ??
    safeAirlineUrl(process.env.NEXT_PUBLIC_ETHIO_AIRLINES_RETURN_URL) ??
    DEFAULT_RETURN_URL
  );
}
