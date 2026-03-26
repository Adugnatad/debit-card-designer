/** Normalized fields used to build the prepaid card request (from customer/info + branch). */
export interface NormalizedCustomerForCard {
  customerId: string;
  firstName: string;
  lastName: string;
  genderRaw: string;
  phoneNumber: string;
  street: string;
  townCountry: string;
  email: string;
}

/** POST /prepaidcard/1.0.0/requestNewCard body (gateway contract). */
export interface RequestNewCardGatewayBody {
  MsgUid: string;
  CustomerCode: string;
  Title: string;
  FirstName: string;
  LastName: string;
  IdNumber: string;
  DateOfBirth: string;
  MaritalStatus: string;
  Gender: string;
  AddressLine1: string;
  City: string;
  PostalCode: string;
  Region: string;
  Phone1: string;
  Email: string;
  District: string;
  CurrCode: string;
  BranchCode: string;
  CardProduct: string;
  EmbossingName: string;
  CustomerIdNumber: string;
  ExtendedCustomerIdNumber: string;
}

/**
 * Branch fields sent through Server Actions — primitives only (no lat/lng).
 * Avoids huge / opaque Flight serialization in the browser→Next POST.
 */
export type CardRequestBranchPayload = {
  branchId: number;
  branchCode: string;
  district: string | null;
};

export type RequestNewCardFlowInput = {
  accountNumber: string;
  branch: CardRequestBranchPayload;
  /**
   * When set (e.g. from `GET /api/fifaworldcup/customer-info`), the server builds the
   * prepaid body from this object and skips a second GET to the gateway.
   */
  customerDetails?: Record<string, unknown>;
};

export type RequestNewCardFlowServerResult =
  | { ok: true }
  | { ok: false; step: "customer" | "card"; message?: string };
