/**
 * OAuth2 client-credentials token for FIFA World Cup flows only.
 * Credentials must be set via env in production; see FIFA_WORLD_CUP_* vars.
 */

import {
  FIFA_OAUTH_AUTHORIZATION_BASIC,
  FIFA_OAUTH_TOKEN_URL,
} from "./fifaWorldCupConstants";

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

let serverCache: CachedToken | null = null;

/** Refresh this many seconds before expiry */
const EXPIRY_BUFFER_SEC = 60;

/** Drop cached token (e.g. after gateway 401) so the next call fetches a new one. */
export function clearFifaWorldCupTokenCache(): void {
  serverCache = null;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type?: string;
};

function getTokenUrl(): string {
  return (
    process.env.FIFA_WORLD_CUP_OAUTH_TOKEN_URL?.trim() || FIFA_OAUTH_TOKEN_URL
  );
}

function getAuthorizationHeader(): string {
  const fromEnv = process.env.FIFA_WORLD_CUP_OAUTH_AUTHORIZATION?.trim();
  if (fromEnv) return fromEnv;
  return FIFA_OAUTH_AUTHORIZATION_BASIC;
}

async function requestNewToken(): Promise<TokenResponse> {
  const url = getTokenUrl();
  const authorization = getAuthorizationHeader();

  if (!authorization) {
    throw new Error(
      "FIFA_WORLD_CUP_OAUTH_AUTHORIZATION is not configured"
    );
  }

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `FIFA OAuth token: invalid JSON (${res.status}): ${text.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error_description" in data &&
      typeof (data as { error_description: unknown }).error_description ===
        "string"
        ? (data as { error_description: string }).error_description
        : typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : text.slice(0, 200);
    throw new Error(`FIFA OAuth token failed (${res.status}): ${msg}`);
  }

  const parsed = data as Partial<TokenResponse>;
  if (
    typeof parsed.access_token !== "string" ||
    typeof parsed.expires_in !== "number"
  ) {
    throw new Error("FIFA OAuth token: missing access_token or expires_in");
  }

  return {
    access_token: parsed.access_token,
    expires_in: parsed.expires_in,
    token_type: parsed.token_type,
  };
}

/**
 * Returns a valid access token, using in-memory cache when still fresh.
 * Server-only (do not import from client components).
 */
export async function getFifaWorldCupAccessToken(): Promise<{
  access_token: string;
  expires_in: number;
  token_type?: string;
}> {
  const now = Date.now();
  const bufferMs = EXPIRY_BUFFER_SEC * 1000;

  if (
    serverCache &&
    serverCache.expiresAtMs > now + bufferMs
  ) {
    return {
      access_token: serverCache.accessToken,
      expires_in: Math.max(
        0,
        Math.floor((serverCache.expiresAtMs - now) / 1000)
      ),
      token_type: "Bearer",
    };
  }

  const fresh = await requestNewToken();
  serverCache = {
    accessToken: fresh.access_token,
    expiresAtMs: now + fresh.expires_in * 1000,
  };

  return {
    access_token: fresh.access_token,
    expires_in: fresh.expires_in,
    token_type: fresh.token_type,
  };
}
