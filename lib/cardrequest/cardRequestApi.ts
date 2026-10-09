/**
 * Browser-side calls for the general `/card-request` page.
 *
 * By decision, this flow uses the existing `/api/fifaworldcup/*` endpoints
 * rather than its own. Every request below is the same URL, method, and body
 * the `/fifaworldcup` page sends (app/fifaworldcup/page.tsx), and success /
 * failure are read from the responses the same way.
 */

import type { Branch } from "@/components/BranchSelector/types";
import {
  buildNewCardManagementRequest,
  parseCustomerDetailsRecordForCard,
  pickSpendableBalanceFromCustomerDetails,
} from "@/lib/fifaworldcup/cardRequestUtils";

const API_BASE = "/api/fifaworldcup";

/** Same balance floor the server-side pipeline enforces. */
const MIN_BALANCE_FOR_CARD_FEE = Number(
  process.env.NEXT_PUBLIC_FIFA_WORLD_CUP_FT_DEBIT_AMOUNT ?? 225
);
const CARD_PRODUCT_DEFAULT = "403";
const CARD_PRODUCT_SPECIAL = "404";
const SPECIAL_CATEGORY_IDS = new Set([
  "6052",
  "6064",
  "6060",
  "6501",
  "6500",
  "1500",
  "6050",
]);

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

export { maskPhoneForOtpHint } from "@/lib/fifaworldcup/maskPhoneNumber";

/** Resolves to the raw phone number the OTP was sent to, or null on failure. */
export async function sendOtp(accountNumber: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountNumber }),
  });
  const data = await readJson<{ success?: boolean; phoneNumber?: string }>(res);
  if (!res.ok || data.success === false) return null;
  const phone = typeof data.phoneNumber === "string" ? data.phoneNumber.trim() : "";
  return phone || null;
}

export async function verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, otpCode }),
  });
  const data = await readJson<{ success?: boolean }>(res);
  return res.ok && data.success !== false;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "insufficient_balance" | "already_has_card" | "failed" };

function categoryIdOf(details: Record<string, unknown> | undefined): string {
  const raw = details?.categoryId;
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return "";
}

/** customer-info, client-side balance check, then card-request. */
export async function submitCardRequest(
  accountNumber: string,
  branch: Branch
): Promise<SubmitResult> {
  const infoRes = await fetch(
    `${API_BASE}/customer-info?accountId=${encodeURIComponent(accountNumber)}`,
    { cache: "no-store" }
  );
  const info = await readJson<{
    success?: boolean;
    step?: string;
    error?: string;
    customerDetails?: Record<string, unknown>;
  }>(infoRes);
  if (!infoRes.ok || !info.success) {
    console.error("[card-request] customer-info failed", `step=${info.step ?? "unknown"}`);
    return { ok: false, reason: "failed" };
  }

  const balance = pickSpendableBalanceFromCustomerDetails(info.customerDetails);
  if (balance === null || balance <= MIN_BALANCE_FOR_CARD_FEE) {
    return { ok: false, reason: "insufficient_balance" };
  }

  const normalized = parseCustomerDetailsRecordForCard(
    info.customerDetails ?? {},
    accountNumber
  );
  if (!normalized) {
    console.error("[card-request] could not compose payload from customerDetails");
    return { ok: false, reason: "failed" };
  }
  const cardProduct = SPECIAL_CATEGORY_IDS.has(categoryIdOf(info.customerDetails))
    ? CARD_PRODUCT_SPECIAL
    : CARD_PRODUCT_DEFAULT;
  const composedPayload = buildNewCardManagementRequest(
    accountNumber,
    normalized,
    branch,
    cardProduct,
    info.customerDetails ?? null
  );

  const res = await fetch(`${API_BASE}/card-request`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountNumber,
      branchId: branch.id,
      branchCode: branch.branchCode,
      district: branch.district ?? null,
      customerDetails: info.customerDetails,
      composedPayload,
    }),
  });
  const result = await readJson<{
    success?: boolean;
    step?: string;
    ResponseCode?: string;
    ResponseType?: string;
    ResponseDescription?: string;
    newCardResponse?: unknown;
  }>(res);
  const responseType =
    typeof result.ResponseType === "string" ? result.ResponseType.trim().toLowerCase() : "";
  const gatewaySuccess =
    res.ok &&
    (result.success === true ||
      responseType === "success" ||
      (typeof result.newCardResponse === "object" && result.newCardResponse !== null));
  if (gatewaySuccess) return { ok: true };

  console.error("[card-request] card-request failed", `step=${result.step ?? "unknown"}`);
  const alreadyHasCard =
    result.ResponseCode === "CD012" ||
    (responseType === "business error" &&
      /maximum number|exceeded|primary cards/i.test(result.ResponseDescription ?? ""));
  return { ok: false, reason: alreadyHasCard ? "already_has_card" : "failed" };
}
