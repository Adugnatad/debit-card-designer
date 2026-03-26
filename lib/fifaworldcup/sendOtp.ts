import {
  clearFifaWorldCupTokenCache,
  getFifaWorldCupAccessToken,
} from "./oauthToken";

const DEFAULT_SEND_OTP_URL =
  "https://externalgateway-apim-uat.coopbankoromiasc.com/soufle/1.0.0/sendOtp";

export type SendOtpResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function postSendOtp(
  accessToken: string,
  accountNumber: string
): Promise<SendOtpResult> {
  const url =
    process.env.FIFA_WORLD_CUP_SEND_OTP_URL?.trim() || DEFAULT_SEND_OTP_URL;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const cookie = process.env.FIFA_WORLD_CUP_GATEWAY_COOKIE?.trim();
  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ accountNumber }),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * Calls gateway sendOtp (FIFA flow only).
 * Uses `preferredAccessToken` when provided (client-validated bearer); otherwise fetches via OAuth.
 * On 401, clears server cache and retries once with a freshly issued token.
 */
export async function sendFifaWorldCupOtp(
  accountNumber: string,
  preferredAccessToken?: string | null
): Promise<SendOtpResult> {
  const trimmed = preferredAccessToken?.trim();
  let access_token = trimmed
    ? trimmed
    : (await getFifaWorldCupAccessToken()).access_token;
  let result = await postSendOtp(access_token, accountNumber);

  if (result.status === 401) {
    clearFifaWorldCupTokenCache();
    access_token = (await getFifaWorldCupAccessToken()).access_token;
    result = await postSendOtp(access_token, accountNumber);
  }

  return result;
}
