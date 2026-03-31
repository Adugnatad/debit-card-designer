import { Pool } from "pg";
import type { CardToCbsGatewayBody, NewCardManagementRequest } from "./cardRequestTypes";

const pool = new Pool({
  host: process.env.VISA_DB_HOST?.trim() || "10.1.152.35",
  port: Number(process.env.VISA_DB_PORT?.trim() || "5432"),
  user: process.env.VISA_DB_USER?.trim() || "visa_user",
  password: process.env.VISA_DB_PASSWORD?.trim() || "V!saDb#26P@y",
  database: process.env.VISA_DB_NAME?.trim() || "visa_card_db",
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

function asNullableJson(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

/**
 * Persist card request/response logs into `card_logs`.
 * Returns true when one row is inserted.
 */
export async function insertVisaCardRecordFromGatewayData(params: {
  accountNumber: string;
  cardRequestBody: NewCardManagementRequest | null;
  cardResponseBody: unknown;
  cardToCbsRequestBody: CardToCbsGatewayBody | null;
  cardToCbsResponseBody: unknown;
}): Promise<boolean> {
  const {
    accountNumber,
    cardRequestBody,
    cardResponseBody,
    cardToCbsRequestBody,
    cardToCbsResponseBody,
  } = params;
  const acct = `${accountNumber ?? ""}`.trim();
  if (!acct) return false;
  const query = `
    INSERT INTO card_logs (
      account_number,
      card_request_body,
      card_response_body,
      card_to_cbs_request_body,
      card_to_cbs_response_body
    )
    VALUES ($1,$2,$3,$4,$5)
  `;

  const values = [
    acct,
    asNullableJson(cardRequestBody),
    asNullableJson(cardResponseBody),
    asNullableJson(cardToCbsRequestBody),
    asNullableJson(cardToCbsResponseBody),
  ];

  const res = await pool.query(query, values);
  return res.rowCount === 1;
}

