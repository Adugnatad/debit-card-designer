/**
 * Regression pins for the /fifaworldcup campaign. The general /card-request
 * flow reuses these modules, so these tests fail if a shared change alters the
 * campaign's gateway contract, parameters, or tracking.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/fifaworldcup/oauthToken", () => ({
  getFifaWorldCupAccessToken: vi.fn(async () => ({ access_token: "tok", expires_in: 3600 })),
  clearFifaWorldCupTokenCache: vi.fn(),
}));
vi.mock("@/lib/fifaworldcup/visaCardDb", () => ({
  insertVisaCardRecordFromGatewayData: vi.fn(async () => true),
}));

import { requestNewCardFlowServer } from "@/lib/fifaworldcup/requestNewCardService";
import { POST as fifaSendOtp } from "@/app/api/fifaworldcup/send-otp/route";
import { POST as fifaCardRequest } from "@/app/api/fifaworldcup/card-request/route";

const GATEWAY = "https://internalgateway-apim.coopbankoromiasc.com";
const ACCT = "1000123456789";
const fetchMock = vi.fn();

const customerDetails = {
  accountId: ACCT,
  customerId: "C-42",
  firstName: "Abebe",
  lastName: "Kebede",
  gender: "MALE",
  availableFunds: "1000",
  categoryId: "1001",
};

function gatewayReplies() {
  fetchMock.mockImplementation(async (url: string) => {
    const body = url.endsWith("/newCardRequest")
      ? { ResponseType: "Success", newCardResponse: { Pan: "4000123412341234", MaskedPan: "4000______1234" } }
      : url.endsWith("/ftVisaCard")
        ? { success: true }
        : url.endsWith("/cardToCbs")
          ? { ResponseType: "Success" }
          : url.endsWith("/sendOtp")
            ? { success: true, phoneNumber: "0911223344" }
            : {};
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

const bodyFor = (suffix: string) => {
  const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith(suffix));
  return call ? JSON.parse(call[1].body) : undefined;
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  for (const fn of ["log", "warn", "error"] as const) {
    vi.spyOn(console, fn).mockImplementation(() => {});
  }
});
afterEach(() => vi.unstubAllGlobals());

describe("/fifaworldcup card pipeline (unchanged)", () => {
  it("hits the same production gateway endpoints in the same order", async () => {
    gatewayReplies();
    const result = await requestNewCardFlowServer({
      accountNumber: ACCT,
      branch: { branchId: 7, branchCode: "ET0010131", district: "ADAMA" },
      customerDetails,
    });
    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      `${GATEWAY}/cardmanagement/1.0.0/newCardRequest`,
      `${GATEWAY}/generic/1.0.0/ftVisaCard`,
      `${GATEWAY}/generic/1.0.0/cardToCbs`,
    ]);
  });

  it("keeps the 225 fee, card product 403/404 and payload shape", async () => {
    gatewayReplies();
    await requestNewCardFlowServer({
      accountNumber: ACCT,
      branch: { branchId: 7, branchCode: "ET0010131", district: "ADAMA" },
      customerDetails: { ...customerDetails, categoryId: "6052" },
    });
    expect(bodyFor("/newCardRequest")).toEqual({
      newCardRequest: {
        accountId: ACCT,
        Title: "MR",
        PreferredLanguage: "EN",
        customerType: "0",
        Region: "14",
        District: "ADAMA",
        BranchCode: "10131",
        DeliveryBranchCode: "10131",
        CardProduct: "404",
        EmbossingName: "ABEBE KEBEDE",
      },
    });
    expect(bodyFor("/ftVisaCard")).toMatchObject({ debitAmount: 225, debitAccount: ACCT });
    expect(bodyFor("/cardToCbs")).toMatchObject({ company: "ET0010131", cardStatus: "90" });
  });

  it("writes card_logs with the plain account number (no 'Generic' tag)", async () => {
    const { insertVisaCardRecordFromGatewayData } = await import("@/lib/fifaworldcup/visaCardDb");
    const insert = vi.mocked(insertVisaCardRecordFromGatewayData);
    insert.mockClear();
    gatewayReplies();
    await requestNewCardFlowServer({
      accountNumber: ACCT,
      branch: { branchId: 7, branchCode: "ET0010131", district: "ADAMA" },
      customerDetails,
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0].accountNumber).toBe(ACCT);
  });
});

describe("/api/fifaworldcup routes (unchanged)", () => {
  const req = (path: string, body: unknown) =>
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;

  it("send-otp keeps its validation message and phone passthrough", async () => {
    const bad = await fifaSendOtp(req("/api/fifaworldcup/send-otp", { accountNumber: "1" }));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ message: "Please enter a valid 13-digit account number." });

    gatewayReplies();
    const ok = await fifaSendOtp(req("/api/fifaworldcup/send-otp", { accountNumber: ACCT }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ success: true, phoneNumber: "0911223344" });
    expect(fetchMock.mock.calls[0][0]).toBe(`${GATEWAY}/soufle/1.0.0/sendOtp`);
  });

  it("card-request keeps its validation contract", async () => {
    const res = await fifaCardRequest(req("/api/fifaworldcup/card-request", { accountNumber: "1" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      step: "validation",
      error: "Invalid account number (need 13 digits).",
    });
  });
});

describe("/fifaworldcup page and tracking (unchanged)", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("keeps GA4, Google Ads and Meta Pixel IDs in the campaign layout", () => {
    const layout = read("app/fifaworldcup/layout.tsx");
    expect(layout).toContain('GA_MEASUREMENT_ID = "G-9FE7R8MJ5H"');
    expect(layout).toContain('GOOGLE_ADS_ID = "AW-18103005190"');
    expect(layout).toContain('META_PIXEL_ID = "236856830933633"');
  });

  it("still calls the campaign API and attribution link", () => {
    const page = read("app/fifaworldcup/page.tsx");
    for (const path of ["send-otp", "verify-otp", "customer-info", "card-request"]) {
      expect(page).toContain(`/api/fifaworldcup/${path}`);
    }
    expect(page).toContain("individualaccount?fifawordlcup");
    expect(page).not.toContain("/api/card-request/");
  });

  it("the general flow's UI has no campaign dependency beyond the shared onboarding link", () => {
    const sharedOnboardingUrl = "https://my.coopbankoromiasc.com/individualaccount?fifawordlcup";
    const flow = read("components/cardrequest/CardRequestFlow.tsx");
    expect(flow).toContain(sharedOnboardingUrl);
    for (const src of [read("app/card-request/page.tsx"), flow.replace(sharedOnboardingUrl, "")]) {
      expect(src).not.toMatch(/fifa|world ?cup|CARD-TO-CUP/i);
    }
  });
});
