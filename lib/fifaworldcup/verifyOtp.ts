import {
  clearFifaWorldCupTokenCache,
  getFifaWorldCupAccessToken,
} from "./oauthToken";
import { FIFA_INTERNAL_GATEWAY_BASE_URL } from "./fifaWorldCupConstants";

const DEFAULT_VERIFY_OTP_URL = `${FIFA_INTERNAL_GATEWAY_BASE_URL}/soufle/1.0.0/verifyOtp`;

export type VerifyOtpResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

async function postVerifyOtp(
  accessToken: string,
  phoneNumber: string,
  otpCode: string
): Promise<VerifyOtpResult> {
  const url =
    process.env.FIFA_WORLD_CUP_VERIFY_OTP_URL?.trim() || DEFAULT_VERIFY_OTP_URL;

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
    body: JSON.stringify({ phoneNumber, otpCode }),
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
 * Calls gateway verifyOtp (FIFA flow only).
 * Uses `preferredAccessToken` when provided; otherwise fetches via OAuth.
 * On 401, clears server cache and retries once with a fresh token.
 */
export async function verifyFifaWorldCupOtp(
  phoneNumber: string,
  otpCode: string,
  preferredAccessToken?: string | null
): Promise<VerifyOtpResult> {
  const trimmed = preferredAccessToken?.trim();
  let access_token = trimmed
    ? trimmed
    : (await getFifaWorldCupAccessToken()).access_token;
  let result = await postVerifyOtp(access_token, phoneNumber, otpCode);

  if (result.status === 401) {
    clearFifaWorldCupTokenCache();
    access_token = (await getFifaWorldCupAccessToken()).access_token;
    result = await postVerifyOtp(access_token, phoneNumber, otpCode);
  }

  return result;
}
