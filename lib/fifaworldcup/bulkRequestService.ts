import type {
  CardRequestBranchPayload,
  CardToCbsGatewayBody,
  NewCardManagementRequest,
  NormalizedCustomerForCard,
} from "./cardRequestTypes";
import {
  fetchFifaCustomerInfo,
  postFifaCardToCbs,
  postFifaRequestNewCard,
} from "./cardRequestGateway";
import { insertVisaCardRecordFromGatewayData } from "./visaCardDb";
import { isCardManagementNewCardSuccess } from "./soufleGatewaySuccess";
import {
  branchPayloadToBranch,
  buildNewCardManagementRequest,
  extractCustomerDetailsPayload,
  parseCustomerDetailsRecordForCard,
  parseCustomerInfoResponse,
  serializeNewCardManagementRequest,
  toEtPrefixedBranchCode,
} from "./cardRequestUtils";

type LegacyBulkInputRecord = {
  id: number | string;
  first_name: string;
  last_name?: string;
  account_number: string;
  branch_code: string;
  district?: string;
  debitAccount: string;
  card_product?: string;
  customer_code?: string;
};

type RawBulkInputRecord = {
  "DISTRICT NAME"?: string;
  "BRANCH NAME"?: string;
  "BRANCH CODE"?: string;
  "PHONE NO"?: number | string;
  "CUSTOMER NAME"?: string;
  "ACCOUNT NUMBER"?: number | string;
};

type DirectBulkInputRecord = {
  accountId?: number | string;
  Title?: string;
  District?: string;
  BranchCode?: string;
  DeliveryBranchCode?: string;
  CardProduct?: string;
  EmbossingName?: string;
};

type NormalizedBulkRecord = {
  id: number | string;
  displayName: string;
  accountNumber: string;
  debitAccount: string;
  branchCode: string;
  district: string;
  directNewCardRequest?: NewCardManagementRequest;
};

export type BulkInputRecord =
  | LegacyBulkInputRecord
  | RawBulkInputRecord
  | DirectBulkInputRecord;

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

function asObject(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function pickString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function digits13(v: unknown): string {
  return `${v ?? ""}`.replace(/\D/g, "").slice(0, 13);
}

function parseCategoryId(customerDetails: Record<string, unknown> | null): string {
  if (!customerDetails) return "";
  const raw = customerDetails.categoryId;
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return "";
}

function resolveCardProduct(customerDetails: Record<string, unknown> | null): string {
  return SPECIAL_CATEGORY_IDS.has(parseCategoryId(customerDetails))
    ? CARD_PRODUCT_SPECIAL
    : CARD_PRODUCT_DEFAULT;
}

function normalizeBulkRecord(row: BulkInputRecord, index: number): {
  ok: true;
  value: NormalizedBulkRecord;
} | {
  ok: false;
  message: string;
  id: number | string;
  accountNumber: string;
  displayName: string;
} {
  const obj = asObject(row);
  if (!obj) {
    return {
      ok: false,
      message: "Record must be an object",
      id: index + 1,
      accountNumber: "",
      displayName: "N/A",
    };
  }

  const hasRawKeys =
    "ACCOUNT NUMBER" in obj ||
    "BRANCH CODE" in obj ||
    "DISTRICT NAME" in obj ||
    "CUSTOMER NAME" in obj;
  const hasDirectKeys =
    "accountId" in obj ||
    "BranchCode" in obj ||
    "CardProduct" in obj ||
    "EmbossingName" in obj;

  if (hasDirectKeys) {
    const accountNumber = digits13(obj.accountId);
    const branchCode = pickString(obj, "BranchCode");
    const deliveryBranchCode = pickString(obj, "DeliveryBranchCode") || branchCode;
    const district = pickString(obj, "District") || "N/A";
    const embossingName = pickString(obj, "EmbossingName").replace(/\s+/g, " ").trim();
    const title = (pickString(obj, "Title") || "MR").toUpperCase();
    const cardProduct = pickString(obj, "CardProduct");
    const id = accountNumber || index + 1;

    if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
      return {
        ok: false,
        message: "Invalid accountId (need 13 digits)",
        id,
        accountNumber,
        displayName: embossingName || "N/A",
      };
    }
    if (!branchCode) {
      return {
        ok: false,
        message: "Missing BranchCode",
        id,
        accountNumber,
        displayName: embossingName || "N/A",
      };
    }
    if (!cardProduct) {
      return {
        ok: false,
        message: "Missing CardProduct",
        id,
        accountNumber,
        displayName: embossingName || "N/A",
      };
    }
    if (cardProduct !== "403" && cardProduct !== "404") {
      return {
        ok: false,
        message: "CardProduct must be 403 or 404",
        id,
        accountNumber,
        displayName: embossingName || "N/A",
      };
    }
    if (!embossingName) {
      return {
        ok: false,
        message: "Missing EmbossingName",
        id,
        accountNumber,
        displayName: "N/A",
      };
    }

    return {
      ok: true,
      value: {
        id,
        displayName: embossingName,
        accountNumber,
        debitAccount: accountNumber,
        branchCode,
        district,
        directNewCardRequest: {
          newCardRequest: {
            accountId: accountNumber,
            Title: title,
            PreferredLanguage: "EN",
            customerType: "0",
            Region: "14",
            District: district,
            BranchCode: branchCode,
            DeliveryBranchCode: deliveryBranchCode,
            CardProduct: cardProduct,
            EmbossingName: embossingName.toUpperCase(),
          },
        },
      },
    };
  }

  if (hasRawKeys) {
    const accountNumber = digits13(obj["ACCOUNT NUMBER"]);
    const branchCode = pickString(obj, "BRANCH CODE");
    const district = pickString(obj, "DISTRICT NAME");
    const customerName = pickString(obj, "CUSTOMER NAME").replace(/\s+/g, " ").trim();
    const id = accountNumber || index + 1;

    if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
      return {
        ok: false,
        message: "Invalid ACCOUNT NUMBER (need 13 digits)",
        id,
        accountNumber,
        displayName: customerName || "N/A",
      };
    }
    if (!branchCode) {
      return {
        ok: false,
        message: "Missing BRANCH CODE",
        id,
        accountNumber,
        displayName: customerName || "N/A",
      };
    }
    if (!district) {
      return {
        ok: false,
        message: "Missing DISTRICT NAME",
        id,
        accountNumber,
        displayName: customerName || "N/A",
      };
    }
    if (!customerName) {
      return {
        ok: false,
        message: "Missing CUSTOMER NAME",
        id,
        accountNumber,
        displayName: "N/A",
      };
    }

    return {
      ok: true,
      value: {
        id,
        displayName: customerName,
        accountNumber,
        debitAccount: accountNumber,
        branchCode,
        district,
        directNewCardRequest: undefined,
      },
    };
  }

  const idRaw = pickString(obj, "id") || index + 1;
  const displayName = pickString(obj, "first_name") || "N/A";
  const accountNumber = digits13(obj.account_number ?? obj.debitAccount);
  const debitAccount = digits13(obj.debitAccount ?? obj.account_number);
  const branchCode = pickString(obj, "branch_code");
  const district = pickString(obj, "district") || "N/A";

  if (!accountNumber || !/^\d{13}$/.test(accountNumber)) {
    return {
      ok: false,
      message: "Invalid account_number/debitAccount (need 13 digits)",
      id: idRaw,
      accountNumber,
      displayName,
    };
  }
  if (!branchCode) {
    return {
      ok: false,
      message: "Missing branch_code",
      id: idRaw,
      accountNumber,
      displayName,
    };
  }

  return {
    ok: true,
    value: {
      id: idRaw,
      displayName,
      accountNumber,
      debitAccount: debitAccount || accountNumber,
      branchCode,
      district,
      directNewCardRequest: undefined,
    },
  };
}

export type BulkResultRow = {
  id: number | string;
  fullName: string;
  account_number: string;
  debitAccount: string;
  card_product: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  card_request_payload?: NewCardManagementRequest;
  card_request_wire_payload?: string;
  card_request_response?: unknown;
  card_to_cbs_payload?: CardToCbsGatewayBody | null;
  card_to_cbs_response?: unknown;
};

function messageFromUnknown(data: unknown): string {
  if (data === null || typeof data !== "object") return "Unknown error";
  const o = data as Record<string, unknown>;
  for (const key of [
    "ResponseDescription",
    "message",
    "error_description",
    "errorMessage",
    "error",
  ]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const err = o.error;
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const em = (err as Record<string, unknown>).message;
    if (typeof em === "string" && em.trim()) return em.trim();
  }
  return "Unknown error";
}

function responseTypeOf(data: unknown): string {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return "";
  const v = (data as Record<string, unknown>).ResponseType;
  return typeof v === "string" ? v.trim() : "";
}

function responseCodeOf(data: unknown): string {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return "";
  const v = (data as Record<string, unknown>).ResponseCode;
  return typeof v === "string" ? v.trim() : "";
}

function isCbsLogicalFailure(data: unknown): boolean {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return true;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.raw === "string") return true;
  if (o.success === false) return true;
  const rt = o.ResponseType;
  if (typeof rt === "string") {
    const lower = rt.trim().toLowerCase();
    if (lower === "failed" || lower === "business error" || lower === "error") {
      return true;
    }
    if (lower === "success") return false;
  }
  if (o.error != null) return true;
  return false;
}

function asTrimmedString(v: unknown): string {
  return `${v ?? ""}`.trim();
}

function dateYmdFromUnknown(v: unknown): string {
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (/^\d{8}$/.test(trimmed)) return trimmed;
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum)) {
      const d = new Date(asNum);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}${m}${day}`;
      }
    }
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}${m}${day}`;
    }
  }
  return "";
}

function buildCardToCbsBody(
  record: NormalizedBulkRecord,
  customerId: string,
  cardResponseData: unknown,
  embossingName: string
): CardToCbsGatewayBody | null {
  if (
    cardResponseData === null ||
    typeof cardResponseData !== "object" ||
    Array.isArray(cardResponseData)
  ) {
    return null;
  }
  const root = cardResponseData as Record<string, unknown>;
  const raw = root.newCardResponse;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const pan = asTrimmedString(r.Pan);
  if (!pan) return null;
  const maskedPan = asTrimmedString(r.MaskedPan).replace(/_/g, "*");
  const currency = asTrimmedString(r.CurrCode) || "230";
  const expiryDate = dateYmdFromUnknown(r.ExpiryDate);
  const issueDate = dateYmdFromUnknown(r.EffectiveDate);

  return {
    company: toEtPrefixedBranchCode(record.branchCode),
    messageId: `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0")}`,
    pan,
    cardStatus: "90",
    account: asTrimmedString(record.debitAccount),
    currency,
    expiryDate,
    issueDate,
    name: embossingName,
    customerId: asTrimmedString(customerId),
    maskedPan,
  };
}

function branchPayloadFromRecord(
  record: NormalizedBulkRecord
): CardRequestBranchPayload {
  return {
    branchId: 1,
    branchCode: record.branchCode,
    district: record.district || null,
  };
}

function buildCardRequestBodyFromCustomer(params: {
  record: NormalizedBulkRecord;
  customer: NormalizedCustomerForCard;
  customerDetails: Record<string, unknown> | null;
}): NewCardManagementRequest {
  const { record, customer, customerDetails } = params;
  const branch = branchPayloadToBranch(branchPayloadFromRecord(record));
  const cardProduct = resolveCardProduct(customerDetails);
  return buildNewCardManagementRequest(
    record.debitAccount,
    customer,
    branch,
    cardProduct,
    customerDetails ?? undefined
  );
}

export async function processBulkRecords(params: {
  records: BulkInputRecord[];
  preferredAccessToken?: string | null;
}): Promise<BulkResultRow[]> {
  const { records, preferredAccessToken } = params;
  const out: BulkResultRow[] = [];

  for (let idx = 0; idx < records.length; idx += 1) {
    const row = records[idx];
    const normalized = normalizeBulkRecord(row, idx);
    const fullName = normalized.ok ? normalized.value.displayName : normalized.displayName;
    const base: BulkResultRow = {
      id: normalized.ok ? normalized.value.id : normalized.id,
      fullName,
      account_number: normalized.ok ? asTrimmedString(normalized.value.accountNumber) : asTrimmedString(normalized.accountNumber),
      debitAccount: normalized.ok ? asTrimmedString(normalized.value.debitAccount) : asTrimmedString(normalized.accountNumber),
      card_product: "N/A",
      status: "FAILED",
      message: "",
      card_to_cbs_payload: null,
    };

    if (!normalized.ok) {
      out.push({ ...base, message: normalized.message });
      continue;
    }

    const source = normalized.value;
    const customerRes = await fetchFifaCustomerInfo(
      source.accountNumber,
      preferredAccessToken
    );
    if (!customerRes.ok) {
      out.push({
        ...base,
        message:
          messageFromUnknown(customerRes.data) ||
          `Customer lookup failed (${customerRes.status})`,
      });
      continue;
    }

    const customerDetails = extractCustomerDetailsPayload(customerRes.data);
    const customerFromDetails = customerDetails
      ? parseCustomerDetailsRecordForCard(customerDetails, source.accountNumber)
      : null;
    const parsedCustomer = customerFromDetails ?? parseCustomerInfoResponse(customerRes.data);
    if (!parsedCustomer) {
      out.push({
        ...base,
        message: "Customer lookup returned invalid details",
      });
      continue;
    }
    const customerId = asTrimmedString(parsedCustomer.customerId);
    if (!customerId) {
      out.push({
        ...base,
        message: "Customer lookup did not return customerId",
      });
      continue;
    }

    const cardRequestBody =
      source.directNewCardRequest ??
      buildCardRequestBodyFromCustomer({
        record: source,
        customer: parsedCustomer,
        customerDetails,
      });
    const resolvedCardProduct = asTrimmedString(
      cardRequestBody.newCardRequest.CardProduct
    );
    base.card_product = resolvedCardProduct || "N/A";
    const cardRequestWirePayload = serializeNewCardManagementRequest(cardRequestBody);
    const embossing = cardRequestBody.newCardRequest.EmbossingName;
    const cardRes = await postFifaRequestNewCard(cardRequestBody, preferredAccessToken);

    if (!cardRes.ok || !isCardManagementNewCardSuccess(cardRes.data)) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: asTrimmedString(source.debitAccount),
          cardRequestBody,
          cardResponseBody: cardRes.data,
          cardToCbsRequestBody: null,
          cardToCbsResponseBody: null,
        });
      } catch (dbErr) {
        console.error("[bulk card] DB insert failed (card failure)", dbErr);
      }
      out.push({
        ...base,
        message:
          `${messageFromUnknown(cardRes.data) || `Card request failed (${cardRes.status})`}` +
          ` | accountIdSent=${cardRequestBody.newCardRequest.accountId}` +
          (responseTypeOf(cardRes.data) ? ` | responseType=${responseTypeOf(cardRes.data)}` : "") +
          (responseCodeOf(cardRes.data) ? ` | responseCode=${responseCodeOf(cardRes.data)}` : ""),
        card_request_payload: cardRequestBody,
        card_request_wire_payload: cardRequestWirePayload,
        card_request_response: cardRes.data,
      });
      continue;
    }

    const cbsBody = buildCardToCbsBody(
      source,
      customerId,
      cardRes.data,
      embossing
    );
    if (!cbsBody) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: asTrimmedString(source.debitAccount),
          cardRequestBody,
          cardResponseBody: cardRes.data,
          cardToCbsRequestBody: null,
          cardToCbsResponseBody: null,
        });
      } catch (dbErr) {
        console.error("[bulk card] DB insert failed (cbs body)", dbErr);
      }
      out.push({
        ...base,
        message: "Could not build cardToCbs payload",
        card_request_payload: cardRequestBody,
        card_request_wire_payload: cardRequestWirePayload,
        card_request_response: cardRes.data,
      });
      continue;
    }

    const cbsRes = await postFifaCardToCbs(cbsBody, preferredAccessToken);

    try {
      await insertVisaCardRecordFromGatewayData({
        accountNumber: asTrimmedString(source.debitAccount),
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: cbsBody,
        cardToCbsResponseBody: cbsRes.data,
      });
    } catch (dbErr) {
      console.error("[bulk card] DB insert failed (post cbs)", dbErr);
    }

    if (!cbsRes.ok || isCbsLogicalFailure(cbsRes.data)) {
      out.push({
        ...base,
        message: messageFromUnknown(cbsRes.data) || `cardToCbs failed (${cbsRes.status})`,
        card_request_payload: cardRequestBody,
        card_request_wire_payload: cardRequestWirePayload,
        card_request_response: cardRes.data,
        card_to_cbs_payload: cbsBody,
        card_to_cbs_response: cbsRes.data,
      });
      continue;
    }

    out.push({
      ...base,
      status: "SUCCESS",
      message: "Operation Successful",
      card_request_payload: cardRequestBody,
      card_request_wire_payload: cardRequestWirePayload,
      card_request_response: cardRes.data,
      card_to_cbs_payload: cbsBody,
      card_to_cbs_response: cbsRes.data,
    });
  }

  return out;
}
