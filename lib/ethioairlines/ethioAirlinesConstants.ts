/**
 * Ethio Airlines checkout endpoints and credentials.
 *
 * URLs default to UAT and are env-overridable so a production cutover is a config
 * change, not a code change. The OAuth credential deliberately has NO source
 * fallback -- unlike `fifaWorldCupConstants.ts`, no secret is committed here.
 */

export const ETHIO_AIRLINES_OAUTH_TOKEN_URL_DEFAULT =
  "https://controlplane-apim-uat.coopbankoromiasc.com/oauth2/token";

export const ETHIO_AIRLINES_GATEWAY_BASE_URL_DEFAULT =
  "https://externalgateway-apim-uat.coopbankoromiasc.com/ethioAirlines/1.0.0";

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getEthioAirlinesTokenUrl(): string {
  return (
    process.env.ETHIO_AIRLINES_OAUTH_TOKEN_URL?.trim() ||
    ETHIO_AIRLINES_OAUTH_TOKEN_URL_DEFAULT
  );
}

export function getEthioAirlinesGatewayBase(): string {
  const base =
    process.env.ETHIO_AIRLINES_GATEWAY_BASE_URL?.trim() ||
    ETHIO_AIRLINES_GATEWAY_BASE_URL_DEFAULT;
  return stripTrailingSlashes(base);
}

export function getEthioAirlinesSendOtpUrl(): string {
  return (
    process.env.ETHIO_AIRLINES_SEND_OTP_URL?.trim() ||
    `${getEthioAirlinesGatewayBase()}/sendOtp`
  );
}

export function getEthioAirlinesVerifyOtpUrl(): string {
  return (
    process.env.ETHIO_AIRLINES_VERIFY_OTP_URL?.trim() ||
    `${getEthioAirlinesGatewayBase()}/verifyOtp`
  );
}

export function getEthioAirlinesConfirmUrl(): string {
  return (
    process.env.ETHIO_AIRLINES_CONFIRM_URL?.trim() ||
    `${getEthioAirlinesGatewayBase()}/confirm`
  );
}

export function getEthioAirlinesGatewayCookie(): string | undefined {
  return process.env.ETHIO_AIRLINES_GATEWAY_COOKIE?.trim() || undefined;
}

const MISSING_CREDENTIAL_MESSAGE =
  "Ethio Airlines OAuth credential is not configured. Set ETHIO_AIRLINES_OAUTH_AUTHORIZATION " +
  '(the full "Basic <base64>" header) in .env.local or the host environment.';

/**
 * Resolves the `Authorization` header for the client-credentials token call.
 * Throws with an actionable message when nothing is configured -- the routes
 * turn that into a 502 so a misconfigured deploy fails loudly instead of
 * silently transacting with the wrong identity.
 */
export function getEthioAirlinesAuthorizationHeader(): string {
  const explicit = process.env.ETHIO_AIRLINES_OAUTH_AUTHORIZATION?.trim();
  if (explicit) {
    return /^(Basic|Bearer)\s/i.test(explicit) ? explicit : `Basic ${explicit}`;
  }

  const base64 =
    process.env.ETHIO_AIRLINES_OAUTH_CLIENT_CREDENTIALS_BASE64?.trim();
  if (base64) {
    return `Basic ${base64}`;
  }

  const clientId = process.env.ETHIO_AIRLINES_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.ETHIO_AIRLINES_OAUTH_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );
    return `Basic ${encoded}`;
  }

  throw new Error(MISSING_CREDENTIAL_MESSAGE);
}

/**
 * Warns once at module load when a production build is still pointed at UAT.
 * Deliberately does not throw -- that would take the whole site down.
 */
function warnIfProductionUsesUat(): void {
  if (process.env.NODE_ENV !== "production") return;
  const base = getEthioAirlinesGatewayBase();
  const token = getEthioAirlinesTokenUrl();
  if (base.includes("-uat") || token.includes("-uat")) {
    console.error(
      "[ethioairlines] PRODUCTION build is pointed at UAT endpoints. " +
        "Set ETHIO_AIRLINES_GATEWAY_BASE_URL and ETHIO_AIRLINES_OAUTH_TOKEN_URL.",
      { gatewayBase: base, tokenUrl: token }
    );
  }
}

warnIfProductionUsesUat();
