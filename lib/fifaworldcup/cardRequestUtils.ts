import type { Branch } from "@/components/BranchSelector/types";
import type {
  CardRequestBranchPayload,
  NewCardManagementRequest,
  NormalizedCustomerForCard,
} from "./cardRequestTypes";

/** MALE → M, FEMALE → F (case-insensitive); otherwise M. */
export function mapGender(gender: string | undefined | null): string {
  const g = (gender ?? "").trim().toUpperCase();
  if (g === "MALE" || g === "M") return "M";
  if (g === "FEMALE" || g === "F") return "F";
  return "M";
}

/** Trim and uppercase for FirstName / LastName / EmbossingName on prepaid card requests. */
export function uppercaseGatewayName(value: string): string {
  return value.trim().toUpperCase();
}

/** MALE → Mr, FEMALE → Ms (case-insensitive); otherwise Mr. */
export function mapTitle(gender: string | undefined | null): string {
  const g = (gender ?? "").trim().toUpperCase();
  if (g === "FEMALE" || g === "F") return "Ms";
  return "Mr";
}

/**
 * Ethiopian-style mobile: leading 0 dropped, prefix +251.
 * Example: 0913668814 → +251913668814
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "+251";
  let rest = digits;
  if (rest.startsWith("251")) {
    return `+${rest}`;
  }
  rest = rest.replace(/^0+/, "");
  return `+251${rest}`;
}

/** Maps minimal branch payload to `Branch` for card request builders (lat/lng unused there). */
export function branchPayloadToBranch(p: CardRequestBranchPayload): Branch {
  return {
    id: p.branchId,
    branchCode: p.branchCode.trim(),
    district: p.district,
    lat: 0,
    lng: 0,
    companyName: null,
    nameAddress: null,
    mnemonic: null,
    languageCode: null,
    phone: null,
  };
}

/** ET0010131 → 10131, ET10003 → 10003 (strip ET, then leading zeros). */
export function transformBranchCode(branchCode: string): string {
  const trimmed = branchCode.trim();
  const withoutEt = trimmed.replace(/^ET/i, "").trim();
  const numeric = withoutEt.replace(/^0+/, "");
  return numeric.length > 0 ? numeric : withoutEt || trimmed;
}

/** Card management API expects branch codes with an `ET` prefix (e.g. `ET10003`, `ET0010104`). */
export function toEtPrefixedBranchCode(branchCode: string): string {
  const t = branchCode.trim().toUpperCase();
  if (!t) return t;
  return t.startsWith("ET") ? t : `ET${t}`;
}

const EMBOSSING_NAME_KEYS = [
  "displayName",
  "DisplayName",
  "customerName",
  "CustomerName",
  "fullName",
  "FullName",
];

function fullNameForEmbossingFromDetails(
  customer: NormalizedCustomerForCard,
  customerDetails: Record<string, unknown> | null | undefined
): string {
  if (customerDetails && typeof customerDetails === "object") {
    const fromApi = pickString(
      customerDetails as Record<string, unknown>,
      EMBOSSING_NAME_KEYS
    );
    if (fromApi) {
      return uppercaseGatewayName(fromApi.replace(/\s+/g, " ").trim());
    }
  }
  const combined = `${customer.firstName} ${customer.lastName}`
    .replace(/\s+/g, " ")
    .trim();
  return uppercaseGatewayName(combined || "CUSTOMER");
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/** Parse a single balance-like field (number or numeric string, commas allowed). */
function parseBalanceNumberField(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

/** Primary spendable amount for card fees (coopapp customer/info). */
const AVAILABLE_FUNDS_KEYS = [
  "availableFunds",
  "AvailableFunds",
  "available_funds",
];

const SPENDABLE_BALANCE_FALLBACK_KEYS = [
  "availableBalance",
  "AvailableBalance",
  "workingBalance",
  "WorkingBalance",
  "onlineActualBalance",
  "OnlineActualBalance",
  "clearedBalance",
  "ClearedBalance",
];

const NESTED_DETAIL_KEYS = [
  "customerDetails",
  "CustomerDetails",
  "data",
  "Data",
  "result",
  "Result",
] as const;

function pickAvailableFundsOnly(
  record: Record<string, unknown>,
  depth = 0
): number | null {
  if (depth > 6) return null;
  for (const key of AVAILABLE_FUNDS_KEYS) {
    const n = parseBalanceNumberField(record[key]);
    if (n !== null) return n;
  }
  for (const nk of NESTED_DETAIL_KEYS) {
    const nested = record[nk];
    if (nested === null || typeof nested !== "object" || Array.isArray(nested)) {
      continue;
    }
    const inner = pickAvailableFundsOnly(nested as Record<string, unknown>, depth + 1);
    if (inner !== null) return inner;
  }
  return null;
}

function pickFallbackSpendableBalance(
  record: Record<string, unknown>
): number | null {
  for (const key of SPENDABLE_BALANCE_FALLBACK_KEYS) {
    const n = parseBalanceNumberField(record[key]);
    if (n !== null) return n;
  }
  return null;
}

/**
 * Card-fee sufficiency prefers **`availableFunds`** (including nested
 * `customerDetails` / `data` envelopes). Other balance fields are used only when
 * `availableFunds` is absent.
 */
export function pickSpendableBalanceFromCustomerDetails(
  record: Record<string, unknown> | null | undefined
): number | null {
  if (record === null || record === undefined || typeof record !== "object") {
    return null;
  }
  const fromFunds = pickAvailableFundsOnly(record);
  if (fromFunds !== null) return fromFunds;
  return pickFallbackSpendableBalance(record);
}

const CUSTOMER_ID_KEYS = [
  "customerId",
  "CustomerCode",
  "customerCode",
  "CustomerId",
  "customerID",
  "CIF",
  "cif",
  "id",
  "Id",
  "accountHolderId",
];

/**
 * Picks the first nested object that contains a customer id (many gateway shapes).
 */
function resolveCustomerRecord(data: unknown): Record<string, unknown> | null {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const nestedCandidates: unknown[] = [
    root,
    root.customerDetails,
    root.CustomerDetails,
    root.data,
    root.Data,
    root.result,
    root.Result,
    root.customer,
    root.payload,
    root.content,
  ];

  for (const cand of nestedCandidates) {
    if (cand === null || typeof cand !== "object" || Array.isArray(cand)) continue;
    const obj = cand as Record<string, unknown>;
    const id = pickString(obj, CUSTOMER_ID_KEYS);
    if (id) return obj;
  }

  return null;
}

const CUSTOMER_INFO_META_KEYS = new Set([
  "success",
  "message",
  "error",
  "error_description",
  "errorMessage",
  "data",
  "result",
]);

/**
 * Object suitable for `{ success: true, customerDetails }` API responses.
 * Prefers gateway `customerDetails`, then nested `data.customerDetails`, then a resolved customer record.
 */
export function extractCustomerDetailsPayload(
  gatewayData: unknown
): Record<string, unknown> | null {
  if (
    gatewayData === null ||
    typeof gatewayData !== "object" ||
    Array.isArray(gatewayData)
  ) {
    return null;
  }
  const root = gatewayData as Record<string, unknown>;
  const topCd = root.customerDetails ?? root.CustomerDetails;
  if (
    topCd !== null &&
    typeof topCd === "object" &&
    !Array.isArray(topCd)
  ) {
    return topCd as Record<string, unknown>;
  }
  const data = root.data ?? root.Data;
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    const inner = d.customerDetails ?? d.CustomerDetails;
    if (
      inner !== null &&
      typeof inner === "object" &&
      !Array.isArray(inner)
    ) {
      return inner as Record<string, unknown>;
    }
  }
  const src = resolveCustomerRecord(gatewayData);
  if (!src) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    if (!CUSTOMER_INFO_META_KEYS.has(k)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Fallback `customerDetails` when the gateway omits a nested `customerDetails` object. */
export function customerDetailsFromNormalized(
  n: NormalizedCustomerForCard
): Record<string, unknown> {
  return {
    customerId: n.customerId,
    firstName: n.firstName,
    lastName: n.lastName,
    gender: n.genderRaw,
    phoneNumber: n.phoneNumber,
    street: n.street,
    townCountry: n.townCountry,
    email: n.email,
  };
}

/**
 * Maps API `customerDetails` (coopapp customer/info shape) to fields for `requestNewCard`.
 * `expectedAccountNumber13` must match `accountId` / `accountNumber` on the record.
 */
export function parseCustomerDetailsRecordForCard(
  record: Record<string, unknown>,
  expectedAccountNumber13: string
): NormalizedCustomerForCard | null {
  const expected = expectedAccountNumber13.replace(/\D/g, "").slice(0, 13);
  if (!/^\d{13}$/.test(expected)) return null;

  const rowAcct = pickString(record, [
    "accountId",
    "accountNumber",
    "AccountId",
  ]);
  if (!rowAcct || rowAcct.replace(/\D/g, "").slice(0, 13) !== expected) {
    return null;
  }

  const customerId = pickString(record, CUSTOMER_ID_KEYS);
  if (!customerId) return null;

  let firstName = pickString(record, ["firstName", "FirstName", "givenName"]);
  let lastName = pickString(record, ["lastName", "LastName", "surname", "familyName"]);
  const displayName = pickString(record, [
    "displayName",
    "customerName",
    "CustomerName",
  ]);

  if (!firstName.trim() && !lastName.trim()) {
    if (displayName.trim()) {
      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      } else if (parts.length === 1) {
        firstName = "";
        lastName = parts[0];
      } else {
        firstName = "Customer";
        lastName = "User";
      }
    } else {
      firstName = "Customer";
      lastName = "User";
    }
  } else {
    if (!lastName.trim() && displayName.trim()) {
      lastName = displayName.trim();
    }
    // Some customer records have blank firstName and full name in lastName/displayName.
    if (!firstName.trim()) {
      if (displayName.trim()) {
        const parts = displayName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          firstName = parts[0];
          if (!lastName.trim()) lastName = parts.slice(1).join(" ");
        } else if (parts.length === 1) {
          firstName = parts[0];
        }
      } else if (lastName.trim()) {
        const parts = lastName.trim().split(/\s+/).filter(Boolean);
        firstName = parts[0] ?? "Customer";
      } else {
        firstName = "Customer";
      }
    }
    if (!lastName.trim()) {
      lastName = firstName.trim() || "User";
    }
  }

  const genderRaw = pickString(record, ["gender", "Gender"]);
  const phoneNumber = pickString(record, [
    "phoneNumber",
    "Phone1",
    "phone",
    "mobile",
    "Mobile",
  ]);
  const street = pickString(record, [
    "street",
    "Street",
    "addressLine1",
    "AddressLine1",
    "address",
  ]);
  const townCountry = pickString(record, [
    "townCountry",
    "city",
    "City",
    "town",
    "region",
  ]);
  const email = pickString(record, ["email", "Email"]);

  return {
    customerId,
    firstName,
    lastName,
    genderRaw,
    phoneNumber,
    street: street || "N/A",
    townCountry: townCountry || "N/A",
    email,
  };
}

/**
 * Flattens customer/info JSON into normalized fields.
 * Supports nested `customerDetails`, `data`, `result`, etc.
 */
export function parseCustomerInfoResponse(data: unknown): NormalizedCustomerForCard | null {
  const src = resolveCustomerRecord(data);
  if (!src) return null;

  const customerId = pickString(src, CUSTOMER_ID_KEYS);
  if (!customerId) return null;

  const firstName = pickString(src, ["firstName", "FirstName", "givenName"]);
  const lastName = pickString(src, ["lastName", "LastName", "surname", "familyName"]);
  const genderRaw = pickString(src, ["gender", "Gender"]);
  const phoneNumber = pickString(src, [
    "phoneNumber",
    "Phone1",
    "phone",
    "mobile",
    "Mobile",
  ]);
  const street = pickString(src, [
    "street",
    "Street",
    "addressLine1",
    "AddressLine1",
    "address",
  ]);
  const townCountry = pickString(src, [
    "townCountry",
    "city",
    "City",
    "town",
    "region",
  ]);
  const email = pickString(src, ["email", "Email"]);

  return {
    customerId,
    firstName: firstName || "Customer",
    lastName: lastName || "User",
    genderRaw,
    phoneNumber,
    street: street || "N/A",
    townCountry: townCountry || "N/A",
    email,
  };
}

/**
 * Builds POST /cardmanagement/1.0.0/newCardRequest JSON from customer info + selected branch.
 */
export function buildNewCardManagementRequest(
  accountId: string,
  customer: NormalizedCustomerForCard,
  branch: Branch,
  cardProduct: string,
  customerDetails: Record<string, unknown> | null | undefined
): NewCardManagementRequest {
  const district = (branch.district ?? "").trim() || "N/A";
  const branchCode = transformBranchCode(branch.branchCode);
  const title = mapTitle(customer.genderRaw).toUpperCase();
  const embossing = fullNameForEmbossingFromDetails(customer, customerDetails);

  return {
    newCardRequest: {
      accountId,
      Title: title,
      PreferredLanguage: "EN",
      customerType: "0",
      Region: "14",
      District: district,
      BranchCode: branchCode,
      DeliveryBranchCode: branchCode,
      CardProduct: cardProduct,
      EmbossingName: embossing,
    },
  };
}

/** JSON body for POST cardmanagement/.../newCardRequest (whitelisted nested shape). */
export function serializeNewCardManagementRequest(
  body: NewCardManagementRequest
): string {
  const inner = body.newCardRequest;
  const payload: NewCardManagementRequest = {
    newCardRequest: {
      accountId: inner.accountId.trim(),
      Title: inner.Title.trim().toUpperCase(),
      PreferredLanguage: "EN",
      customerType: inner.customerType.trim() || "0",
      Region: inner.Region.trim() || "14",
      District: inner.District.trim(),
      // cardmanagement/newCardRequest expects numeric branch codes (no ET prefix).
      BranchCode: transformBranchCode(inner.BranchCode),
      DeliveryBranchCode: transformBranchCode(inner.DeliveryBranchCode),
      CardProduct: inner.CardProduct.trim(),
      EmbossingName: uppercaseGatewayName(inner.EmbossingName),
    },
  };
  return JSON.stringify(payload);
}
