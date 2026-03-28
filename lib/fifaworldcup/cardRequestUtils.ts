import { v4 as uuidv4 } from "uuid";
import type { Branch } from "@/components/BranchSelector/types";
import type {
  CardRequestBranchPayload,
  NormalizedCustomerForCard,
  RequestNewCardGatewayBody,
} from "./cardRequestTypes";

const CURR_CODE = "840";
const CARD_PRODUCT = "403";
const TEMP_DOB = "1990-01-01";
const MARITAL_STATUS = "M";
const DEFAULT_EMAIL = "default@mail.com";
const POSTAL_CODE = "12345";

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

/** Maps minimal branch payload to `Branch` for `buildRequestNewCardBody` (lat/lng unused there). */
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

/** ET0010131 → 10131 (strip leading ET00, case-insensitive). */
export function transformBranchCode(branchCode: string): string {
  const trimmed = branchCode.trim();
  const stripped = trimmed.replace(/^ET00/i, "").trim();
  return stripped.length > 0 ? stripped : trimmed;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
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
    root.data,
    root.result,
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
  const topCd = root.customerDetails;
  if (
    topCd !== null &&
    typeof topCd === "object" &&
    !Array.isArray(topCd)
  ) {
    return topCd as Record<string, unknown>;
  }
  const data = root.data;
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const inner = (data as Record<string, unknown>).customerDetails;
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

export function buildRequestNewCardBody(
  customer: NormalizedCustomerForCard,
  branch: Branch
): RequestNewCardGatewayBody {
  const gender = mapGender(customer.genderRaw);
  const title = mapTitle(customer.genderRaw);
  const phone1 = formatPhoneNumber(customer.phoneNumber);
  const branchCode = transformBranchCode(branch.branchCode);
  const district = (branch.district ?? "").trim();
  const email =
    customer.email.trim() !== "" ? customer.email.trim() : DEFAULT_EMAIL;
  const firstName = uppercaseGatewayName(customer.firstName);
  const lastName = uppercaseGatewayName(customer.lastName);
  const embossing = `${firstName} ${lastName}`.trim();

  return {
    MsgUid: uuidv4(),
    CustomerCode: customer.customerId,
    Title: title,
    FirstName: firstName,
    LastName: lastName,
    IdNumber: customer.customerId,
    DateOfBirth: TEMP_DOB,
    MaritalStatus: MARITAL_STATUS,
    Gender: gender,
    AddressLine1: customer.street,
    City: customer.townCountry,
    PostalCode: POSTAL_CODE,
    Region: customer.townCountry,
    Phone1: phone1,
    Email: email,
    District: district,
    CurrCode: CURR_CODE,
    BranchCode: branchCode,
    CardProduct: CARD_PRODUCT,
    EmbossingName: embossing,
    CustomerIdNumber: customer.customerId,
    ExtendedCustomerIdNumber: customer.customerId,
  };
}

/**
 * JSON body for POST prepaidcard/.../requestNewCard ONLY.
 * Whitelists fields so accountNumber / branch never appear on the wire.
 */
export function serializeRequestNewCardGatewayBody(
  body: RequestNewCardGatewayBody
): string {
  const payload: RequestNewCardGatewayBody = {
    MsgUid: body.MsgUid,
    CustomerCode: body.CustomerCode,
    Title: body.Title,
    FirstName: uppercaseGatewayName(body.FirstName),
    LastName: uppercaseGatewayName(body.LastName),
    IdNumber: body.IdNumber,
    DateOfBirth: body.DateOfBirth,
    MaritalStatus: body.MaritalStatus,
    Gender: body.Gender,
    AddressLine1: body.AddressLine1,
    City: body.City,
    PostalCode: body.PostalCode,
    Region: body.Region,
    Phone1: body.Phone1,
    Email: body.Email,
    District: body.District,
    CurrCode: body.CurrCode,
    BranchCode: body.BranchCode,
    CardProduct: body.CardProduct,
    EmbossingName: uppercaseGatewayName(body.EmbossingName),
    CustomerIdNumber: body.CustomerIdNumber,
    ExtendedCustomerIdNumber: body.ExtendedCustomerIdNumber,
  };
  return JSON.stringify(payload);
}
