/**
 * Server-only FIFA card request pipeline.
 *
 * Callers pass `{ accountNumber, branch }` as **function arguments** (e.g. Server Action).
 * The outbound POST to prepaid `requestNewCard` uses ONLY `serializeRequestNewCardGatewayBody(payload)`.
 */

import type {
  FtVisaCardGatewayBody,
  NormalizedCustomerForCard,
  RequestNewCardFlowInput,
  RequestNewCardFlowServerResult,
} from "./cardRequestTypes";
import {
  branchPayloadToBranch,
  buildRequestNewCardBody,
  extractCustomerDetailsPayload,
  parseCustomerDetailsRecordForCard,
  parseCustomerInfoResponse,
} from "./cardRequestUtils";
import {
  fetchFifaCustomerInfo,
  postFifaFtVisaCard,
  postFifaRequestNewCard,
} from "./cardRequestGateway";
import { isSoufleGatewayLogicalFailure } from "./soufleGatewaySuccess";
import { insertVisaCardRecordFromGatewayData } from "./visaCardDb";

const FT_DEBIT_AMOUNT = Number(process.env.FIFA_WORLD_CUP_FT_DEBIT_AMOUNT ?? 120);
const FT_NARRATIVE_FALLBACK = "CBORddddETAA";
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

/** Customer/info often returns 200 + JSON without `success: true`; do not use Soufle `message` heuristic here. */
function isCustomerInfoLogicalFailure(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.raw === "string") return true;
  if (o.success === false) return true;
  return false;
}

function messageFromUnknown(data: unknown): string | undefined {
  if (data === null || typeof data !== "object") return undefined;
  const o = data as Record<string, unknown>;
  for (const key of ["message", "error_description", "errorMessage"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function isFundTransferLogicalFailure(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.raw === "string") return true;
  if (o.success === false) return true;
  const rt = o.ResponseType;
  if (typeof rt === "string" && rt.trim().toLowerCase() === "failed") return true;
  return false;
}

function generateFundTransferMessageId(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  // Numeric-only unique id (timestamp + random digits).
  return `${ts}${rand}`;
}

function parseBalanceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function narrativeFromCardResponse(cardData: unknown): string {
  if (cardData === null || typeof cardData !== "object" || Array.isArray(cardData)) {
    return FT_NARRATIVE_FALLBACK;
  }
  const root = cardData as Record<string, unknown>;
  const newCard = root.newCardResponse;
  if (newCard === null || typeof newCard !== "object" || Array.isArray(newCard)) {
    return FT_NARRATIVE_FALLBACK;
  }
  const pan = (newCard as Record<string, unknown>).Pan;
  if (typeof pan === "string" && pan.trim()) return pan.trim();
  return FT_NARRATIVE_FALLBACK;
}

export type CustomerInfoStepResult =
  | {
      ok: true;
      normalized: NormalizedCustomerForCard;
      /** Raw gateway JSON (e.g. includes `customerDetails` for API passthrough). */
      gatewayData: unknown;
    }
  | { ok: false; step: "customer"; message?: string };

/**
 * **Always** runs GET customer/info before any card logic. `requestNewCard` must never
 * be called without a successful return from this function.
 */
async function loadCustomerDetailsForCardRequest(
  accountNumber: string,
  preferredAccessToken?: string | null
): Promise<CustomerInfoStepResult> {
  const customerRes = await fetchFifaCustomerInfo(
    accountNumber,
    preferredAccessToken
  );

  console.log(
    "[FIFA card] customer/info response",
    customerRes.status,
    typeof customerRes.data === "object" && customerRes.data !== null
      ? Object.keys(customerRes.data as object)
      : customerRes.data
  );

  if (!customerRes.ok) {
    return {
      ok: false,
      step: "customer",
      message:
        messageFromUnknown(customerRes.data) ||
        `Customer lookup failed (${customerRes.status})`,
    };
  }

  if (isCustomerInfoLogicalFailure(customerRes.data)) {
    return {
      ok: false,
      step: "customer",
      message: messageFromUnknown(customerRes.data) || "Customer lookup failed",
    };
  }

  const normalized = parseCustomerInfoResponse(customerRes.data);
  if (!normalized) {
    console.warn(
      "[FIFA card] parseCustomerInfoResponse returned null; raw sample:",
      JSON.stringify(customerRes.data).slice(0, 800)
    );
    return {
      ok: false,
      step: "customer",
      message: "Invalid customer information response",
    };
  }

  return { ok: true, normalized, gatewayData: customerRes.data };
}

/** Same as the customer step inside `requestNewCardFlowServer` — use for `GET /api/.../customer-info`. */
export async function runFifaCustomerInfoStep(
  accountNumber: string,
  preferredAccessToken?: string | null
): Promise<CustomerInfoStepResult> {
  return loadCustomerDetailsForCardRequest(accountNumber, preferredAccessToken);
}

/**
 * 1) Customer source: **either** client `customerDetails` (from customer-info API) **or**
 *    GET gateway customer/info (`loadCustomerDetailsForCardRequest`).
 * 2) Build prepaid payload from normalized customer + branch
 * 3) POST prepaidcard/.../requestNewCard
 */
export async function requestNewCardFlowServer(
  input: RequestNewCardFlowInput,
  preferredAccessToken?: string | null
): Promise<RequestNewCardFlowServerResult> {
  const { accountNumber, branch: branchPayload, customerDetails: provided } =
    input;
  const branch = branchPayloadToBranch(branchPayload);

  let customerStep: CustomerInfoStepResult;

  if (
    provided !== null &&
    provided !== undefined &&
    typeof provided === "object" &&
    !Array.isArray(provided) &&
    Object.keys(provided).length > 0
  ) {
    const rec = provided as Record<string, unknown>;
    const normalized = parseCustomerDetailsRecordForCard(rec, accountNumber);
    if (!normalized) {
      return {
        ok: false,
        step: "customer",
        message:
          "Invalid customerDetails: must match accountNumber and include customerId / accountId.",
      };
    }
    console.log(
      "[FIFA card] using request body customerDetails — skipping GET customer/info"
    );
    customerStep = { ok: true, normalized, gatewayData: rec };
  } else {
    console.log(
      "[FIFA card] pipeline start — step 1: GET customer/info (then requestNewCard)"
    );
    customerStep = await loadCustomerDetailsForCardRequest(
      accountNumber,
      preferredAccessToken
    );
  }

  if (!customerStep.ok) {
    return customerStep;
  }

  const customerPayload = extractCustomerDetailsPayload(customerStep.gatewayData);
  const categoryIdRaw = customerPayload?.categoryId;
  const categoryId =
    typeof categoryIdRaw === "string"
      ? categoryIdRaw.trim()
      : typeof categoryIdRaw === "number" && Number.isFinite(categoryIdRaw)
        ? String(categoryIdRaw)
        : "";
  const resolvedCardProduct = SPECIAL_CATEGORY_IDS.has(categoryId)
    ? CARD_PRODUCT_SPECIAL
    : CARD_PRODUCT_DEFAULT;

  const balance = parseBalanceNumber(customerPayload?.balance);
  if (balance === null || balance <= FT_DEBIT_AMOUNT) {
    return {
      ok: false,
      step: "fund",
      message: "Insufficient balance",
      data: customerPayload ?? customerStep.gatewayData,
    };
  }

  console.log(
    "[FIFA card] customer data ready — calling requestNewCard (prepaid POST)"
  );

  const payload = buildRequestNewCardBody(customerStep.normalized, branch);
  payload.CardProduct = resolvedCardProduct;

  console.log("FINAL CARD PAYLOAD:", payload);

  const cardRes = await postFifaRequestNewCard(
    payload,
    preferredAccessToken
  );

  console.log(
    "[FIFA card] requestNewCard response",
    cardRes.status,
    typeof cardRes.data === "object" && cardRes.data !== null
      ? Object.keys(cardRes.data as object)
      : cardRes.data
  );

  if (!cardRes.ok) {
    return {
      ok: false,
      step: "card",
      message:
        messageFromUnknown(cardRes.data) ||
        `Card request failed (${cardRes.status})`,
      data: cardRes.data,
    };
  }

  if (isSoufleGatewayLogicalFailure(cardRes.data)) {
    return {
      ok: false,
      step: "card",
      message: messageFromUnknown(cardRes.data) || "Card request failed",
      data: cardRes.data,
    };
  }

  try {
    const inserted = await insertVisaCardRecordFromGatewayData(cardRes.data, payload);
    console.log("[FIFA card] DB insert visa_cards", inserted ? "OK" : "SKIPPED");
  } catch (dbErr: unknown) {
    console.error("[FIFA card] DB insert visa_cards failed", dbErr);
  }

  console.log(
    "[FIFA card] card request OK — now charging account"
  );

  const narrative = narrativeFromCardResponse(cardRes.data);
  const ftBody: FtVisaCardGatewayBody = {
    messageId: generateFundTransferMessageId(),
    debitAmount: FT_DEBIT_AMOUNT,
    narrative,
    debitAccount: accountNumber,
  };

  console.log(
    "[FIFA card] charging account after successful card request",
    {
      debitAmount: ftBody.debitAmount,
      messageId: ftBody.messageId,
      debitAccountMasked: accountNumber.replace(/\d(?=\d{4})/g, "*"),
    }
  );

  const ftRes = await postFifaFtVisaCard(ftBody, preferredAccessToken);
  console.log(
    "[FIFA card] ftVisaCard response",
    ftRes.status,
    typeof ftRes.data === "object" && ftRes.data !== null
      ? Object.keys(ftRes.data as object)
      : ftRes.data
  );
  console.log(
    "[FIFA card] ftVisaCard raw body",
    typeof ftRes.data === "string"
      ? ftRes.data
      : JSON.stringify(ftRes.data, null, 2)
  );

  if (!ftRes.ok || isFundTransferLogicalFailure(ftRes.data)) {
    console.warn("[FIFA card] fund transfer failed after card-request success");
    return {
      ok: false,
      step: "fund",
      message:
        messageFromUnknown(ftRes.data) ||
        `Fund transfer failed (${ftRes.status})`,
      data: ftRes.data,
    };
  }

  const ftObj =
    ftRes.data && typeof ftRes.data === "object" && !Array.isArray(ftRes.data)
      ? (ftRes.data as Record<string, unknown>)
      : null;
  const ftData =
    ftObj?.data && typeof ftObj.data === "object" && !Array.isArray(ftObj.data)
      ? (ftObj.data as Record<string, unknown>)
      : null;
  const txId =
    typeof ftData?.transactionId === "string"
      ? ftData.transactionId
      : "unknown";
  const msgId =
    typeof ftData?.messageId === "string"
      ? ftData.messageId
      : ftBody.messageId;
  console.log(
    "[FIFA card] fund transfer deducted successfully",
    {
      transactionId: txId,
      messageId: msgId,
      debitAmount: ftBody.debitAmount,
      debitAccountMasked: accountNumber.replace(/\d(?=\d{4})/g, "*"),
    }
  );

  return { ok: true, data: cardRes.data };
}
