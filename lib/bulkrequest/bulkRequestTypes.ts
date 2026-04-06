import type {
  CardToCbsGatewayBody,
  NewCardManagementRequest,
} from "@/lib/fifaworldcup/cardRequestTypes";

export type BulkInputRow = {
  id?: number | string | null;
  title?: string | null;
  first_name?: string | null;
  customer_code?: string | null;
  debitAccount?: string | null;
  branch_code?: string | null;
  district?: string | null;
  region?: string | null;
  preferred_language?: string | null;
  customer_type?: string | null;
  card_product?: string | number | null;
  [key: string]: unknown;
};

export type BulkRowStep = "validation" | "card" | "cbs" | "db";
export type BulkRowStatus = "ok" | "failed";

export type BulkRowResult = {
  index: number;
  inputId: string;
  debitAccount: string;
  branchCode: string;
  flippedCardProduct: string;
  status: BulkRowStatus;
  step: BulkRowStep;
  message: string;
  cardRequestBody?: NewCardManagementRequest;
  cardResponseBody?: unknown;
  cardToCbsRequestBody?: CardToCbsGatewayBody | null;
  cardToCbsResponseBody?: unknown;
};

export type BulkProcessSummary = {
  total: number;
  ok: number;
  failed: number;
};

export type BulkProcessResponse =
  | {
      success: true;
      summary: BulkProcessSummary;
      rows: BulkRowResult[];
    }
  | {
      success: false;
      step: "validation" | "auth" | "server";
      error: string;
    };
