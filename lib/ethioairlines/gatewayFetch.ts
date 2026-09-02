/**
 * Single JSON transport for every Ethio Airlines gateway call.
 *
 * The fifaworldcup flow repeats this block in sendOtp.ts, verifyOtp.ts and
 * cardRequestGateway.ts; it is written once here and shared by the three callers.
 */

import {
  getEthioAirlinesGatewayCookie,
} from "./ethioAirlinesConstants";
import {
  clearEthioAirlinesTokenCache,
  getEthioAirlinesAccessToken,
} from "./oauthToken";

export type EthioAirlinesResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function postOnce(
  url: string,
  body: unknown,
  accessToken: string
): Promise<EthioAirlinesResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const cookie = getEthioAirlinesGatewayCookie();
  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // `raw` is the signal the logical-failure detectors key on.
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * POSTs JSON with a server-minted Bearer token.
 *
 * The token is NEVER accepted from the caller. It used to be: the browser
 * fetched one from /api/ethioairlines/token and passed it back, which meant any
 * visitor held a live bank-gateway credential usable directly against APIM.
 *
 * On 401 -- and only on 401 -- clears the cache and retries exactly once. A 401
 * happens before the upstream does any work, so the retry is safe; 5xx and
 * network failures are never retried here because they may have executed.
 */
export async function postEthioAirlinesJson(
  url: string,
  body: unknown
): Promise<EthioAirlinesResult> {
  let accessToken = (await getEthioAirlinesAccessToken()).access_token;

  let result = await postOnce(url, body, accessToken);

  if (result.status === 401) {
    clearEthioAirlinesTokenCache();
    accessToken = (await getEthioAirlinesAccessToken()).access_token;
    result = await postOnce(url, body, accessToken);
  }

  return result;
}
