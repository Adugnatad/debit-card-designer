/**
 * Server-only FIFA card request pipeline.
 *
 * Callers pass `{ accountNumber, branch }` as **function arguments** (e.g. Server Action).
 * The outbound POST to prepaid `requestNewCard` uses ONLY `serializeRequestNewCardGatewayBody(payload)`.
 */

import type {
  NormalizedCustomerForCard,
  RequestNewCardFlowInput,
  RequestNewCardFlowServerResult,
} from "./cardRequestTypes";
import {
  branchPayloadToBranch,
  buildRequestNewCardBody,
  parseCustomerDetailsRecordForCard,
  parseCustomerInfoResponse,
} from "./cardRequestUtils";
import {
  fetchFifaCustomerInfo,
  postFifaRequestNewCard,
} from "./cardRequestGateway";
import { isSoufleGatewayLogicalFailure } from "./soufleGatewaySuccess";

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

  console.log(
    "[FIFA card] customer data ready — calling requestNewCard (prepaid POST)"
  );

  const payload = buildRequestNewCardBody(customerStep.normalized, branch);

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
    };
  }

  if (isSoufleGatewayLogicalFailure(cardRes.data)) {
    return {
      ok: false,
      step: "card",
      message: messageFromUnknown(cardRes.data) || "Card request failed",
    };
  }

  return { ok: true };
}
