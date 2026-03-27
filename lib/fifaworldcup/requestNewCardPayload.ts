import { randomUUID } from "node:crypto";

const DEFAULT_REQUEST_URL =
  "https://internalgateway-apim.coopbankoromiasc.com/prepaidcard/1.0.0/requestNewCard";

export function getRequestNewCardUrl(): string {
  return (
    process.env.FIFA_WORLD_CUP_REQUEST_NEW_CARD_URL?.trim() ||
    DEFAULT_REQUEST_URL
  );
}

/**
 * Builds prepaid card request body. Only `accountNumber` comes from the UI today;
 * other fields use env overrides (FIFA_WORLD_CUP_CARD_*) or safe UAT placeholders.
 */
export function buildRequestNewCardBody(accountNumber: string): Record<string, string> {
  const emboss =
    process.env.FIFA_WORLD_CUP_CARD_EMBOSSING?.trim() ||
    `COOP ${accountNumber.slice(-6)}`;

  return {
    MsgUid: randomUUID(),
    CustomerCode: accountNumber,
    Title: process.env.FIFA_WORLD_CUP_CARD_TITLE?.trim() || "Mr",
    FirstName:
      process.env.FIFA_WORLD_CUP_CARD_FIRST_NAME?.trim() || "Customer",
    LastName:
      process.env.FIFA_WORLD_CUP_CARD_LAST_NAME?.trim() || accountNumber,
    IdNumber: accountNumber,
    DateOfBirth:
      process.env.FIFA_WORLD_CUP_CARD_DOB?.trim() || "1990-01-01",
    MaritalStatus:
      process.env.FIFA_WORLD_CUP_CARD_MARITAL?.trim() || "M",
    Gender: process.env.FIFA_WORLD_CUP_CARD_GENDER?.trim() || "M",
    AddressLine1:
      process.env.FIFA_WORLD_CUP_CARD_ADDRESS1?.trim() || "N/A",
    City: process.env.FIFA_WORLD_CUP_CARD_CITY?.trim() || "N/A",
    PostalCode:
      process.env.FIFA_WORLD_CUP_CARD_POSTAL?.trim() || "12345",
    Region: process.env.FIFA_WORLD_CUP_CARD_REGION?.trim() || "N/A",
    Phone1:
      process.env.FIFA_WORLD_CUP_CARD_PHONE?.trim() || "+251000000000",
    Email:
      process.env.FIFA_WORLD_CUP_CARD_EMAIL?.trim() ||
      "customer@example.com",
    District:
      process.env.FIFA_WORLD_CUP_CARD_DISTRICT?.trim() || "N/A",
    CurrCode: process.env.FIFA_WORLD_CUP_CARD_CURR?.trim() || "840",
    BranchCode:
      process.env.FIFA_WORLD_CUP_CARD_BRANCH?.trim() || "10104",
    CardProduct:
      process.env.FIFA_WORLD_CUP_CARD_PRODUCT?.trim() || "403",
    EmbossingName: emboss,
    CustomerIdNumber: accountNumber,
    ExtendedCustomerIdNumber: accountNumber,
  };
}
