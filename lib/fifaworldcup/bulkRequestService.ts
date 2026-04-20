import type {
  CardToCbsGatewayBody,
  NewCardManagementRequest,
} from "./cardRequestTypes";
import {
  fetchFifaCustomerInfo,
  postFifaCardToCbs,
  postFifaRequestNewCard,
} from "./cardRequestGateway";
import { insertVisaCardRecordFromGatewayData } from "./visaCardDb";
import { isCardManagementNewCardSuccess } from "./soufleGatewaySuccess";
import {
  parseCustomerInfoResponse,
  serializeNewCardManagementRequest,
} from "./cardRequestUtils";

export type BulkInputRecord = {
  id: number | string;
  first_name: string;
  last_name?: string;
  account_number: string;
  branch_code: string;
  district?: string;
  card_product: string;
  customer_code: string;
  debitAccount: string;
};

export type BulkDirectInputRecord = {
  accountId: number | string;
  Title: string;
  District: string;
  BranchCode: string;
  DeliveryBranchCode: string;
  CardProduct: string;
  EmbossingName: string;
};

type NormalizedBulkRecord = {
  id: number | string;
  accountId: string;
  title: string;
  district: string;
  branchCode: string;
  deliveryBranchCode: string;
  cardProduct: string;
  embossingName: string;
  customerCode: string;
};

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

function isSupportedCardProduct(cardProduct: string): string | null {
  const p = `${cardProduct ?? ""}`.trim();
  if (p === "403") return "403";
  if (p === "404") return "404";
  return null;
}

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

function buildFullName(r: BulkInputRecord): string {
  const first = asTrimmedString(r.first_name);
  return first || "N/A";
}

function normalizeCompanyEt00(branchCode: string): string {
  const b = asTrimmedString(branchCode).toUpperCase();
  const digits = b.replace(/^ET/i, "").replace(/\D/g, "");
  const padded = digits.padStart(7, "0");
  return `ET${padded}`;
}

function validateBulkRecord(r: BulkInputRecord): string | null {
  if (r == null || typeof r !== "object") return "Record must be an object";
  if (!asTrimmedString(r.id)) return "Missing id";
  if (!asTrimmedString(r.first_name)) return "Missing first_name";
  if (!asTrimmedString(r.account_number)) return "Missing account_number";
  if (!asTrimmedString(r.branch_code)) return "Missing branch_code";
  if (!asTrimmedString(r.card_product)) return "Missing card_product";
  if (!asTrimmedString(r.customer_code)) return "Missing customer_code";
  if (!asTrimmedString(r.debitAccount)) return "Missing debitAccount";
  if (!isSupportedCardProduct(asTrimmedString(r.card_product))) {
    return "card_product must be 403 or 404";
  }
  return null;
}

function normalizeLegacyRecord(record: BulkInputRecord): NormalizedBulkRecord {
  const invalid = validateBulkRecord(record);
  if (invalid) {
    throw new Error(invalid);
  }
  const accountId = asTrimmedString(record.debitAccount);
  return {
    id: record.id,
    accountId,
    title: "MR",
    district: asTrimmedString(record.district) || "N/A",
    branchCode: asTrimmedString(record.branch_code),
    deliveryBranchCode: asTrimmedString(record.branch_code),
    cardProduct: asTrimmedString(record.card_product),
    embossingName: buildFullName(record).toUpperCase() || "CUSTOMER",
    customerCode: asTrimmedString(record.customer_code),
  };
}

function validateDirectInputRecord(r: BulkDirectInputRecord): string | null {
  if (r == null || typeof r !== "object") return "Record must be an object";
  const accountId = asTrimmedString(r.accountId);
  if (!accountId) return "Missing accountId";
  if (!asTrimmedString(r.Title)) return "Missing Title";
  if (!asTrimmedString(r.District)) return "Missing District";
  if (!asTrimmedString(r.BranchCode)) return "Missing BranchCode";
  if (!asTrimmedString(r.DeliveryBranchCode)) return "Missing DeliveryBranchCode";
  if (!isSupportedCardProduct(asTrimmedString(r.CardProduct))) {
    return "CardProduct must be 403 or 404";
  }
  if (!asTrimmedString(r.EmbossingName)) return "Missing EmbossingName";
  return null;
}

async function normalizeDirectInputRecord(params: {
  record: BulkDirectInputRecord;
  preferredAccessToken?: string | null;
}): Promise<NormalizedBulkRecord> {
  const { record, preferredAccessToken } = params;
  const invalid = validateDirectInputRecord(record);
  if (invalid) {
    throw new Error(invalid);
  }
  const accountId = asTrimmedString(record.accountId);
  const customerInfoRes = await fetchFifaCustomerInfo(accountId, preferredAccessToken);
  if (!customerInfoRes.ok) {
    throw new Error(
      messageFromUnknown(customerInfoRes.data) ||
        `Customer lookup failed (${customerInfoRes.status})`
    );
  }
  const normalized = parseCustomerInfoResponse(customerInfoRes.data);
  if (!normalized || !asTrimmedString(normalized.customerId)) {
    throw new Error("Customer lookup returned no customerId");
  }
  return {
    id: accountId,
    accountId,
    title: asTrimmedString(record.Title).toUpperCase(),
    district: asTrimmedString(record.District) || "N/A",
    branchCode: asTrimmedString(record.BranchCode),
    deliveryBranchCode: asTrimmedString(record.DeliveryBranchCode),
    cardProduct: asTrimmedString(record.CardProduct),
    embossingName: asTrimmedString(record.EmbossingName).toUpperCase(),
    customerCode: asTrimmedString(normalized.customerId),
  };
}

function isLegacyBulkRecord(row: unknown): row is BulkInputRecord {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return false;
  const o = row as Record<string, unknown>;
  return "debitAccount" in o || "customer_code" in o || "first_name" in o;
}

function isDirectBulkRecord(row: unknown): row is BulkDirectInputRecord {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return false;
  const o = row as Record<string, unknown>;
  return "accountId" in o && "BranchCode" in o && "CardProduct" in o;
}

async function normalizeInputRecord(params: {
  row: BulkInputRecord | BulkDirectInputRecord;
  preferredAccessToken?: string | null;
}): Promise<NormalizedBulkRecord> {
  const { row, preferredAccessToken } = params;
  if (isLegacyBulkRecord(row)) {
    return normalizeLegacyRecord(row);
  }
  if (isDirectBulkRecord(row)) {
    return normalizeDirectInputRecord({
      record: row,
      preferredAccessToken,
    });
  }
  throw new Error("Unsupported row format");
}

function buildCardRequestBody(record: NormalizedBulkRecord): NewCardManagementRequest {
  const cardProduct = isSupportedCardProduct(record.cardProduct) ?? "404";
  return {
    newCardRequest: {
      accountId: record.accountId,
      Title: asTrimmedString(record.title).toUpperCase() || "MR",
      PreferredLanguage: "EN",
      customerType: "0",
      Region: "14",
      District: record.district,
      BranchCode: record.branchCode,
      DeliveryBranchCode: record.deliveryBranchCode,
      CardProduct: cardProduct,
      EmbossingName: record.embossingName || "CUSTOMER",
    },
  };
}

function buildCardToCbsBody(
  record: NormalizedBulkRecord,
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
    company: normalizeCompanyEt00(record.branchCode),
    messageId: `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0")}`,
    pan,
    cardStatus: "90",
    account: record.accountId,
    currency,
    expiryDate,
    issueDate,
    name: embossingName,
    customerId: record.customerCode,
    maskedPan,
  };
}

export async function processBulkRecords(params: {
  records: Array<BulkInputRecord | BulkDirectInputRecord>;
  preferredAccessToken?: string | null;
}): Promise<BulkResultRow[]> {
  const { records, preferredAccessToken } = params;
  const out: BulkResultRow[] = [];

  for (const row of records) {
    const rowId =
      row && typeof row === "object" && "id" in row
        ? asTrimmedString((row as Record<string, unknown>).id)
        : row && typeof row === "object" && "accountId" in row
          ? asTrimmedString((row as Record<string, unknown>).accountId)
          : "N/A";
    const fullName =
      row && typeof row === "object" && "first_name" in row
        ? buildFullName(row as BulkInputRecord)
        : asTrimmedString((row as Record<string, unknown>)?.EmbossingName) || "N/A";
    const cardProductDisplay =
      row && typeof row === "object" && "card_product" in row
        ? asTrimmedString((row as Record<string, unknown>).card_product)
        : asTrimmedString((row as Record<string, unknown>)?.CardProduct);
    const debitAccountDisplay =
      row && typeof row === "object" && "debitAccount" in row
        ? asTrimmedString((row as Record<string, unknown>).debitAccount)
        : asTrimmedString((row as Record<string, unknown>)?.accountId);
    const base: BulkResultRow = {
      id: rowId,
      fullName,
      account_number: debitAccountDisplay,
      debitAccount: debitAccountDisplay,
      card_product: cardProductDisplay || "N/A",
      status: "FAILED",
      message: "",
      card_to_cbs_payload: null,
    };

    let normalized: NormalizedBulkRecord;
    try {
      normalized = await normalizeInputRecord({
        row,
        preferredAccessToken,
      });
    } catch (e: unknown) {
      out.push({
        ...base,
        message: e instanceof Error && e.message ? e.message : "Invalid row",
      });
      continue;
    }

    const cardRequestBody = buildCardRequestBody(normalized);
    const cardRequestWirePayload = serializeNewCardManagementRequest(cardRequestBody);
    const embossing = cardRequestBody.newCardRequest.EmbossingName;
    const cardRes = await postFifaRequestNewCard(cardRequestBody, preferredAccessToken);

    if (!cardRes.ok || !isCardManagementNewCardSuccess(cardRes.data)) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: normalized.accountId,
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

    const cbsBody = buildCardToCbsBody(normalized, cardRes.data, embossing);
    if (!cbsBody) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: normalized.accountId,
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
        accountNumber: normalized.accountId,
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
