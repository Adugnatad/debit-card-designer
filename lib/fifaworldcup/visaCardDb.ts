import { Pool } from "pg";
import type { NewCardRequestInner } from "./cardRequestTypes";

type NewCardResponse = {
  RspDateTime?: unknown;
  FirstName?: unknown;
  LastName?: unknown;
  InstitutionCode?: unknown;
  AccountNumber?: unknown;
  CurrCode?: unknown;
  AlphaCode?: unknown;
  Pan?: unknown;
  MaskedPan?: unknown;
  VPan?: unknown;
  ExpiryDate?: unknown;
  EffectiveDate?: unknown;
};

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function asBigIntString(v: unknown): string {
  const s = asString(v).trim();
  return /^\d+$/.test(s) ? s : "0";
}

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

/**
 * Persist successful `newCardResponse` fields into `visa_cards`.
 * Returns true when one row is inserted.
 */
export async function insertVisaCardRecordFromGatewayData(
  gatewayData: unknown,
  requestInner?: NewCardRequestInner
): Promise<boolean> {
  if (gatewayData === null || typeof gatewayData !== "object") return false;
  const root = gatewayData as Record<string, unknown>;
  const raw = root.newCardResponse;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return false;
  const r = raw as NewCardResponse;

  const query = `
    INSERT INTO visa_cards (
      rsp_date_time, first_name, last_name, institution_code,
      account_number, curr_code, alpha_code, pan, masked_pan,
      vpan, expiry_date, effective_date,
      msg_uid, customer_code, title, id_number, date_of_birth,
      marital_status, gender, address_line1, city, postal_code,
      region, phone1, email, district, branch_code, card_product,
      embossing_name, customer_id_number, extended_customer_id_number
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
      $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
    )
  `;

  const values = [
    asBigIntString(r.RspDateTime),
    asString(r.FirstName),
    asString(r.LastName),
    asString(r.InstitutionCode),
    asString(r.AccountNumber),
    asString(r.CurrCode),
    asString(r.AlphaCode),
    asString(r.Pan),
    asString(r.MaskedPan),
    asString(r.VPan),
    asBigIntString(r.ExpiryDate),
    asBigIntString(r.EffectiveDate),
    "",
    asString(requestInner?.accountId),
    asString(requestInner?.Title),
    asString(requestInner?.accountId),
    "",
    "",
    "",
    "",
    "",
    "",
    asString(requestInner?.Region),
    "",
    "",
    asString(requestInner?.District),
    asString(requestInner?.BranchCode),
    asString(requestInner?.CardProduct),
    asString(requestInner?.EmbossingName),
    asString(requestInner?.accountId),
    asString(requestInner?.accountId),
  ];

  const res = await pool.query(query, values);
  return res.rowCount === 1;
}

