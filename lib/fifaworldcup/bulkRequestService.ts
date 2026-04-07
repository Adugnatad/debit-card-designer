import type {
  CardToCbsGatewayBody,
  NewCardManagementRequest,
} from "./cardRequestTypes";
import {
  postFifaCardToCbs,
  postFifaRequestNewCard,
} from "./cardRequestGateway";
import { insertVisaCardRecordFromGatewayData } from "./visaCardDb";
import { isCardManagementNewCardSuccess } from "./soufleGatewaySuccess";
import { serializeNewCardManagementRequest } from "./cardRequestUtils";

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

function swapCardProduct(cardProduct: string): string | null {
  const p = `${cardProduct ?? ""}`.trim();
  if (p === "403") return "404";
  if (p === "404") return "403";
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
  if (!swapCardProduct(asTrimmedString(r.card_product))) {
    return "card_product must be 403 or 404";
  }
  return null;
}

function buildCardRequestBody(record: BulkInputRecord): NewCardManagementRequest {
  const swapped = swapCardProduct(record.card_product) ?? "404";
  const branchCode = asTrimmedString(record.branch_code);
  const embossingName = buildFullName(record).toUpperCase();
  const district = asTrimmedString(record.district) || "N/A";
  return {
    newCardRequest: {
      accountId: asTrimmedString(record.debitAccount),
      Title: "MR",
      PreferredLanguage: "EN",
      customerType: "0",
      Region: "14",
      District: district,
      BranchCode: branchCode,
      DeliveryBranchCode: branchCode,
      CardProduct: swapped,
      EmbossingName: embossingName || "CUSTOMER",
    },
  };
}

function buildCardToCbsBody(
  record: BulkInputRecord,
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
    company: normalizeCompanyEt00(record.branch_code),
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
    customerId: asTrimmedString(record.customer_code),
    maskedPan,
  };
}

export async function processBulkRecords(params: {
  records: BulkInputRecord[];
  preferredAccessToken?: string | null;
}): Promise<BulkResultRow[]> {
  const { records, preferredAccessToken } = params;
  const out: BulkResultRow[] = [];

  for (const row of records) {
    const fullName = buildFullName(row);
    const swapped = swapCardProduct(asTrimmedString(row.card_product)) ?? "N/A";
    const base: BulkResultRow = {
      id: row.id,
      fullName,
      account_number: asTrimmedString(row.debitAccount),
      debitAccount: asTrimmedString(row.debitAccount),
      card_product: swapped,
      status: "FAILED",
      message: "",
      card_to_cbs_payload: null,
    };

    const invalid = validateBulkRecord(row);
    if (invalid) {
      out.push({ ...base, message: invalid });
      continue;
    }

    const cardRequestBody = buildCardRequestBody(row);
    const cardRequestWirePayload = serializeNewCardManagementRequest(cardRequestBody);
    const embossing = cardRequestBody.newCardRequest.EmbossingName;
    const cardRes = await postFifaRequestNewCard(cardRequestBody, preferredAccessToken);

    if (!cardRes.ok || !isCardManagementNewCardSuccess(cardRes.data)) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: asTrimmedString(row.debitAccount),
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

    const cbsBody = buildCardToCbsBody(row, cardRes.data, embossing);
    if (!cbsBody) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: asTrimmedString(row.debitAccount),
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
        accountNumber: asTrimmedString(row.debitAccount),
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
