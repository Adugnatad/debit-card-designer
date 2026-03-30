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

/** POST /cardmanagement/1.0.0/newCardRequest inner body (gateway contract). */
export interface NewCardRequestInner {
  accountId: string;
  Title: string;
  PreferredLanguage: string;
  customerType: string;
  Region: string;
  District: string;
  BranchCode: string;
  DeliveryBranchCode: string;
  CardProduct: string;
  EmbossingName: string;
}

/** POST /cardmanagement/1.0.0/newCardRequest wrapper. */
export interface NewCardManagementRequest {
  newCardRequest: NewCardRequestInner;
}

/** POST /generic/1.0.0/ftVisaCard body (gateway contract). */
export interface FtVisaCardGatewayBody {
  messageId: string;
  debitAmount: number;
  narrative: string;
  debitAccount: string;
}

/** POST /generic/1.0.0/cardToCbs body (gateway contract). */
export interface CardToCbsGatewayBody {
  company: string;
  messageId: string;
  pan: string;
  cardStatus: string;
  account: string;
  currency: string;
  expiryDate: string;
  issueDate: string;
  name: string;
  customerId: string;
  maskedPan: string;
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
  | { ok: true; data: unknown }
  | {
      ok: false;
      step: "customer" | "fund" | "card" | "cbs";
      message?: string;
      data?: unknown;
    };
