/**
 * Generic client-credentials token with a mutable cache holder (separate cache per API).
 */

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

const EXPIRY_BUFFER_MS = 60_000;

export type TokenCacheHolder = { current: CachedToken | null };

export function clearTokenCache(holder: TokenCacheHolder): void {
  holder.current = null;
}

export async function getOAuthAccessTokenCached(
  holder: TokenCacheHolder,
  resolveTokenUrl: () => string,
  resolveAuthorizationHeader: () => string,
  label: string
): Promise<{ access_token: string }> {
  const now = Date.now();
  if (
    holder.current &&
    holder.current.expiresAtMs > now + EXPIRY_BUFFER_MS
  ) {
    return { access_token: holder.current.accessToken };
  }

  const url = resolveTokenUrl();
  const authorization = resolveAuthorizationHeader();
  if (!authorization) {
    throw new Error(`${label}: OAuth authorization is not configured`);
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
    throw new Error(`${label}: invalid JSON (${res.status})`);
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
    throw new Error(`${label}: token failed (${res.status}): ${msg}`);
  }

  const parsed = data as Partial<TokenResponse>;
  if (
    typeof parsed.access_token !== "string" ||
    typeof parsed.expires_in !== "number"
  ) {
    throw new Error(`${label}: missing access_token or expires_in`);
  }

  holder.current = {
    accessToken: parsed.access_token,
    expiresAtMs: now + parsed.expires_in * 1000,
  };

  return { access_token: parsed.access_token };
}
