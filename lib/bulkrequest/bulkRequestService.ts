import type {
  CardToCbsGatewayBody,
  NewCardManagementRequest,
} from "@/lib/fifaworldcup/cardRequestTypes";
import {
  postFifaCardToCbs,
  postFifaRequestNewCard,
} from "@/lib/fifaworldcup/cardRequestGateway";
import { isCardManagementNewCardSuccess } from "@/lib/fifaworldcup/soufleGatewaySuccess";
import { insertVisaCardRecordFromGatewayData } from "@/lib/fifaworldcup/visaCardDb";
import type { BulkInputRow, BulkRowResult } from "./bulkRequestTypes";

function asText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function normalizeDigits(v: unknown): string {
  return asText(v).replace(/\D/g, "");
}

function flipCardProduct(v: unknown): string {
  const p = asText(v);
  if (p === "403") return "404";
  if (p === "404") return "403";
  return p || "403";
}

function mapTitle(v: unknown): string {
  const raw = asText(v).toUpperCase();
  if (raw === "MS" || raw === "MRS" || raw === "MISS") return "MS";
  if (raw === "MR") return "MR";
  return "MR";
}

function embossingFromFirstName(v: unknown): string {
  return asText(v).toUpperCase() || "CUSTOMER";
}

function toEt00Company(branchCode: unknown): string {
  const digits = normalizeDigits(branchCode);
  if (!digits) return "ET00";
  return `ET00${digits}`;
}

function generateMessageId(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `${ts}${rand}`;
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

function maskPanForCbs(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().replace(/_/g, "*");
}

function messageFromUnknown(data: unknown): string {
  if (data === null || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  for (const key of [
    "ResponseDescription",
    "message",
    "error_description",
    "errorMessage",
  ]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function isCardToCbsFailure(data: unknown): boolean {
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
    if (lower === "success") {
      return false;
    }
  }
  if (o.error != null) return true;
  return false;
}

function buildCardRequestBody(row: BulkInputRow): NewCardManagementRequest {
  const district = asText(row.district) || "N/A";
  const branchCode = asText(row.branch_code);
  return {
    newCardRequest: {
      accountId: asText(row.debitAccount),
      Title: mapTitle(row.title),
      PreferredLanguage: asText(row.preferred_language).toUpperCase() || "EN",
      customerType: asText(row.customer_type) || "0",
      Region: asText(row.region) || "14",
      District: district,
      BranchCode: branchCode,
      DeliveryBranchCode: branchCode,
      CardProduct: flipCardProduct(row.card_product),
      EmbossingName: embossingFromFirstName(row.first_name),
    },
  };
}

function buildCardToCbsBody(
  row: BulkInputRow,
  cardRequestBody: NewCardManagementRequest,
  cardData: unknown
): CardToCbsGatewayBody | null {
  if (cardData === null || typeof cardData !== "object" || Array.isArray(cardData)) {
    return null;
  }
  const root = cardData as Record<string, unknown>;
  const newCard = root.newCardResponse;
  if (newCard === null || typeof newCard !== "object" || Array.isArray(newCard)) {
    return null;
  }
  const r = newCard as Record<string, unknown>;
  const pan = asText(r.Pan);
  if (!pan) return null;
  const currency = asText(r.CurrCode) || "230";
  return {
    company: toEt00Company(row.branch_code),
    messageId: generateMessageId(),
    pan,
    cardStatus: "90",
    account: asText(row.debitAccount),
    currency,
    expiryDate: dateYmdFromUnknown(r.ExpiryDate),
    issueDate: dateYmdFromUnknown(r.EffectiveDate),
    name: cardRequestBody.newCardRequest.EmbossingName,
    customerId: asText(row.customer_code),
    maskedPan: maskPanForCbs(r.MaskedPan),
  };
}

function validateRow(row: BulkInputRow): string {
  if (!asText(row.debitAccount)) return "Missing debitAccount";
  if (!asText(row.branch_code)) return "Missing branch_code";
  if (!asText(row.first_name)) return "Missing first_name";
  if (!asText(row.customer_code)) return "Missing customer_code";
  const cardProduct = asText(row.card_product);
  if (!cardProduct) return "Missing card_product";
  if (cardProduct !== "403" && cardProduct !== "404") {
    return "card_product must be 403 or 404";
  }
  return "";
}

export async function processBulkRows(
  rows: BulkInputRow[],
  preferredAccessToken?: string | null
): Promise<BulkRowResult[]> {
  const results: BulkRowResult[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const inputId = asText(row.id) || String(i + 1);
    const debitAccount = asText(row.debitAccount);
    const branchCode = asText(row.branch_code);
    const flippedCardProduct = flipCardProduct(row.card_product);

    const validationError = validateRow(row);
    if (validationError) {
      results.push({
        index: i,
        inputId,
        debitAccount,
        branchCode,
        flippedCardProduct,
        status: "failed",
        step: "validation",
        message: validationError,
      });
      continue;
    }

    const cardRequestBody = buildCardRequestBody(row);
    const cardRes = await postFifaRequestNewCard(cardRequestBody, preferredAccessToken);
    const cardSuccess = cardRes.ok && isCardManagementNewCardSuccess(cardRes.data);

    if (!cardSuccess) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: debitAccount,
          cardRequestBody,
          cardResponseBody: cardRes.data,
          cardToCbsRequestBody: null,
          cardToCbsResponseBody: null,
        });
      } catch (dbErr: unknown) {
        console.error("[bulkrequest] DB insert failed after card error", dbErr);
      }
      results.push({
        index: i,
        inputId,
        debitAccount,
        branchCode,
        flippedCardProduct,
        status: "failed",
        step: "card",
        message:
          messageFromUnknown(cardRes.data) ||
          `Card request failed (${cardRes.status})`,
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: null,
        cardToCbsResponseBody: null,
      });
      continue;
    }

    const cbsBody = buildCardToCbsBody(row, cardRequestBody, cardRes.data);
    if (!cbsBody) {
      try {
        await insertVisaCardRecordFromGatewayData({
          accountNumber: debitAccount,
          cardRequestBody,
          cardResponseBody: cardRes.data,
          cardToCbsRequestBody: null,
          cardToCbsResponseBody: null,
        });
      } catch (dbErr: unknown) {
        console.error("[bulkrequest] DB insert failed after cbs build error", dbErr);
      }
      results.push({
        index: i,
        inputId,
        debitAccount,
        branchCode,
        flippedCardProduct,
        status: "failed",
        step: "cbs",
        message: "Could not build cardToCbs payload from card response",
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: null,
        cardToCbsResponseBody: null,
      });
      continue;
    }

    const cbsRes = await postFifaCardToCbs(cbsBody, preferredAccessToken);
    const cbsFailure = !cbsRes.ok || isCardToCbsFailure(cbsRes.data);

    try {
      await insertVisaCardRecordFromGatewayData({
        accountNumber: debitAccount,
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: cbsBody,
        cardToCbsResponseBody: cbsRes.data,
      });
    } catch (dbErr: unknown) {
      console.error("[bulkrequest] DB insert failed", dbErr);
      results.push({
        index: i,
        inputId,
        debitAccount,
        branchCode,
        flippedCardProduct,
        status: "failed",
        step: "db",
        message: "Saved request flow failed at DB insert",
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: cbsBody,
        cardToCbsResponseBody: cbsRes.data,
      });
      continue;
    }

    if (cbsFailure) {
      results.push({
        index: i,
        inputId,
        debitAccount,
        branchCode,
        flippedCardProduct,
        status: "failed",
        step: "cbs",
        message:
          messageFromUnknown(cbsRes.data) || `cardToCbs failed (${cbsRes.status})`,
        cardRequestBody,
        cardResponseBody: cardRes.data,
        cardToCbsRequestBody: cbsBody,
        cardToCbsResponseBody: cbsRes.data,
      });
      continue;
    }

    results.push({
      index: i,
      inputId,
      debitAccount,
      branchCode,
      flippedCardProduct,
      status: "ok",
      step: "cbs",
      message: "Card request and cardToCbs completed",
      cardRequestBody,
      cardResponseBody: cardRes.data,
      cardToCbsRequestBody: cbsBody,
      cardToCbsResponseBody: cbsRes.data,
    });
  }

  return results;
}
