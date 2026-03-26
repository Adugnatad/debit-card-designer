import {
  clearFifaWorldCupTokenCache,
  getFifaWorldCupAccessToken,
} from "./oauthToken";
import type { RequestNewCardGatewayBody } from "./cardRequestTypes";
import { serializeRequestNewCardGatewayBody } from "./cardRequestUtils";

const DEFAULT_BASE = "https://internalgateway-apim.coopbankoromiasc.com";

function gatewayBase(): string {
  return process.env.FIFA_WORLD_CUP_GATEWAY_BASE_URL?.trim() || DEFAULT_BASE;
}

function customerInfoUrl(accountId: string): string {
  const override = process.env.FIFA_WORLD_CUP_CUSTOMER_INFO_URL?.trim();
  if (override) {
    const sep = override.includes("?") ? "&" : "?";
    return `${override}${sep}accountId=${encodeURIComponent(accountId)}`;
  }
  return `${gatewayBase()}/coopapp/1.0.0/customer/info?accountId=${encodeURIComponent(accountId)}`;
}

function requestNewCardUrl(): string {
  return (
    process.env.FIFA_WORLD_CUP_REQUEST_NEW_CARD_URL?.trim() ||
    `${gatewayBase()}/prepaidcard/1.0.0/requestNewCard`
  );
}

function gatewayHeaders(accessToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  const cookie = process.env.FIFA_WORLD_CUP_GATEWAY_COOKIE?.trim();
  if (cookie) headers.Cookie = cookie;
  return headers;
}

export type GatewayJsonResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

/**
 * GET customer/info for accountId. Retries once on 401 after clearing token cache.
 */
export async function fetchFifaCustomerInfo(
  accountId: string,
  preferredAccessToken?: string | null
): Promise<GatewayJsonResult> {
  const url = customerInfoUrl(accountId);
  console.log(
    "[FIFA card] customer/info → HTTP GET, no request body (accountId in query only)",
    url.replace(/\d{10,}/g, "***")
  );
  const trimmed = preferredAccessToken?.trim();
  let token = trimmed
    ? trimmed
    : (await getFifaWorldCupAccessToken()).access_token;

  const run = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        method: "GET",
        headers: gatewayHeaders(token),
        cache: "no-store",
      });
    } catch (networkErr: unknown) {
      const msg =
        networkErr instanceof Error ? networkErr.message : "Network error";
      console.error(
        "[FIFA card] customer/info fetch threw (network/DNS/TLS)",
        msg,
        networkErr
      );
      throw networkErr;
    }
  };

  let res: Response;
  try {
    res = await run();
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Customer info request failed (network error)" },
    };
  }

  let data = await parseJson(res);

  if (res.status === 401) {
    clearFifaWorldCupTokenCache();
    token = (await getFifaWorldCupAccessToken()).access_token;
    try {
      res = await run();
    } catch {
      return {
        ok: false,
        status: 0,
        data: { message: "Customer info request failed after token refresh" },
      };
    }
    data = await parseJson(res);
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * POST requestNewCard. Retries once on 401 after clearing token cache.
 */
export async function postFifaRequestNewCard(
  body: RequestNewCardGatewayBody,
  preferredAccessToken?: string | null
): Promise<GatewayJsonResult> {
  const url = requestNewCardUrl();
  console.log("[FIFA card] POST requestNewCard", url);
  const trimmed = preferredAccessToken?.trim();
  let token = trimmed
    ? trimmed
    : (await getFifaWorldCupAccessToken()).access_token;

  /** Whitelisted JSON only — never accountNumber or branch object. */
  const jsonBody = serializeRequestNewCardGatewayBody(body);

  const headers = {
    ...gatewayHeaders(token),
    "Content-Type": "application/json",
  };

  const run = async () =>
    fetch(url, {
      method: "POST",
      headers,
      body: jsonBody,
      cache: "no-store",
    });

  let res = await run();
  let data = await parseJson(res);

  if (res.status === 401) {
    clearFifaWorldCupTokenCache();
    token = (await getFifaWorldCupAccessToken()).access_token;
    const retryHeaders = {
      ...gatewayHeaders(token),
      "Content-Type": "application/json",
    };
    res = await fetch(url, {
      method: "POST",
      headers: retryHeaders,
      body: jsonBody,
      cache: "no-store",
    });
    data = await parseJson(res);
  }

  return { ok: res.ok, status: res.status, data };
}
