/**
 * Ethio Airlines client-credentials token.
 *
 * Thin adapter over the generic cache in lib/fifaworldcup/oauthClientCredentialsCached.ts
 * (which already does grant_type=client_credentials over x-www-form-urlencoded with a
 * 60s expiry buffer). The holder below is a cache instance distinct from the FIFA one.
 */

import {
  clearTokenCache,
  getOAuthAccessTokenCached,
  type TokenCacheHolder,
} from "@/lib/fifaworldcup/oauthClientCredentialsCached";
import {
  getEthioAirlinesAuthorizationHeader,
  getEthioAirlinesTokenUrl,
} from "./ethioAirlinesConstants";

const LABEL = "Ethio Airlines OAuth";
const DEFAULT_EXPIRES_IN = 3600;

const tokenCache: TokenCacheHolder = { current: null };

export function clearEthioAirlinesTokenCache(): void {
  clearTokenCache(tokenCache);
}

export async function getEthioAirlinesAccessToken(): Promise<{
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
}> {
  const { access_token } = await getOAuthAccessTokenCached(
    tokenCache,
    getEthioAirlinesTokenUrl,
    getEthioAirlinesAuthorizationHeader,
    LABEL
  );

  // The generic helper returns only the token; derive the remaining lifetime from
  // our own holder so the shared module stays untouched.
  const expiresAtMs = tokenCache.current?.expiresAtMs;
  const expires_in =
    typeof expiresAtMs === "number"
      ? Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      : DEFAULT_EXPIRES_IN;

  return { access_token, expires_in, token_type: "Bearer" };
}
