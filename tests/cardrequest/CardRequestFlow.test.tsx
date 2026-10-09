// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";

vi.mock("next/image", () => ({
  default: ({ priority: _p, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

// The real selector loads branches and Google Maps; the flow only needs its contract.
vi.mock("@/components/BranchSelector/BranchSelectorStep", () => ({
  BranchSelectorStep: (props: {
    selectedBranch: { companyName?: string } | null;
    onBranchSelect: (b: unknown) => void;
    onContinue: () => void;
    continueLoading?: boolean;
  }) => (
    <div>
      <button
        onClick={() =>
          props.onBranchSelect({
            id: 7,
            branchCode: "ET0010131",
            district: "ADAMA",
            companyName: "Hawas Branch",
            lat: 0,
            lng: 0,
          })
        }
      >
        pick branch
      </button>
      <button onClick={() => void props.onContinue()} disabled={!props.selectedBranch}>
        {props.continueLoading ? "submitting" : "continue"}
      </button>
    </div>
  ),
}));

import CardRequestFlow from "@/components/cardrequest/CardRequestFlow";

type Reply = { status?: number; body: unknown };
const fetchMock = vi.fn();

/** Routes are keyed by path; the query string (customer-info) is ignored. */
function replyWith(routes: Record<string, Reply | (() => Promise<Reply>)>) {
  fetchMock.mockImplementation(async (url: string) => {
    const r = routes[url.split("?")[0]];
    if (!r) throw new Error(`unexpected fetch ${url}`);
    const { status = 200, body } = typeof r === "function" ? await r() : r;
    return new Response(JSON.stringify(body), { status });
  });
}

const ACCT = "1000123456789";
const CUSTOMER = {
  accountId: ACCT,
  customerId: "C-42",
  firstName: "Abebe",
  lastName: "Kebede",
  gender: "MALE",
  availableFunds: "1000",
  categoryId: "6052",
};

const HAPPY: Record<string, Reply> = {
  "/api/fifaworldcup/send-otp": { body: { success: true, phoneNumber: "0911223344" } },
  "/api/fifaworldcup/verify-otp": { body: { success: true } },
  "/api/fifaworldcup/customer-info": { body: { success: true, customerDetails: CUSTOMER } },
  "/api/fifaworldcup/card-request": {
    body: { ResponseType: "Success", newCardResponse: { MaskedPan: "4000______1234" } },
  },
};

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  window.scrollTo = () => {};
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const accountInput = () => screen.getByPlaceholderText("Enter 13-digit account number");
const sendButton = () => screen.getByRole("button", { name: /send otp/i });

async function reachBranchStep() {
  fireEvent.change(accountInput(), { target: { value: "1000123456789" } });
  fireEvent.click(sendButton());
  await screen.findByText("09******3344");
  fireEvent.change(screen.getByPlaceholderText("6-digit code"), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: /verify otp/i }));
  await screen.findByRole("button", { name: "pick branch" });
}

describe("CardRequestFlow", () => {
  it("renders the general card request experience with no campaign branding", () => {
    const { container } = render(<CardRequestFlow />);
    expect(screen.getByRole("heading", { name: "Request a Debit Card" })).toBeTruthy();
    for (const step of ["Account verification", "OTP verification", "Branch selection", "Success"]) {
      expect(screen.getByText(step)).toBeTruthy();
    }
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/fifa|world cup|visa/i);
    const srcs = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "");
    expect(srcs.some((s) => /CARD-TO-CUP|cup|visa/i.test(s))).toBe(false);
    // The onboarding link is shared with the campaign page by decision.
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefs).toEqual(["https://my.coopbankoromiasc.com/individualaccount?fifawordlcup"]);
    const link = screen.getByRole("link", { name: /click here/i });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("validates the account number before allowing Send OTP", () => {
    render(<CardRequestFlow />);
    expect((sendButton() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(accountInput(), { target: { value: "12ab34" } });
    expect((accountInput() as HTMLInputElement).value).toBe("1234");
    fireEvent.blur(accountInput());
    expect(screen.getByText("Please enter a valid 13-digit customer account number")).toBeTruthy();
    fireEvent.change(accountInput(), { target: { value: "1000123456789" } });
    expect((sendButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("prefills the account from the server-validated query param", () => {
    render(<CardRequestFlow initialAccount="1000123456789" />);
    expect((accountInput() as HTMLInputElement).value).toBe("1000123456789");
  });

  it("completes the flow through the same /api/fifaworldcup requests as the campaign", async () => {
    replyWith(HAPPY);
    render(<CardRequestFlow />);
    await reachBranchStep();
    fireEvent.click(screen.getByRole("button", { name: "pick branch" }));
    fireEvent.click(screen.getByRole("button", { name: "continue" }));

    await screen.findByText("Card request submitted.");
    expect(screen.getByText(/Please visit Hawas Branch to collect/)).toBeTruthy();

    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "/api/fifaworldcup/send-otp",
      "/api/fifaworldcup/verify-otp",
      `/api/fifaworldcup/customer-info?accountId=${ACCT}`,
      "/api/fifaworldcup/card-request",
    ]);
    const body = (i: number) => JSON.parse(fetchMock.mock.calls[i][1].body);
    expect(body(0)).toEqual({ accountNumber: ACCT });
    expect(body(1)).toEqual({ phoneNumber: "0911223344", otpCode: "123456" });
    expect(body(3)).toEqual({
      accountNumber: ACCT,
      branchId: 7,
      branchCode: "ET0010131",
      district: "ADAMA",
      customerDetails: CUSTOMER,
      composedPayload: {
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
      },
    });
  });

  it("shows a loading state while the OTP is being sent", async () => {
    let release!: (r: Reply) => void;
    replyWith({ "/api/fifaworldcup/send-otp": () => new Promise<Reply>((r) => (release = r)) });
    render(<CardRequestFlow />);
    fireEvent.change(accountInput(), { target: { value: "1000123456789" } });
    fireEvent.click(sendButton());
    expect(await screen.findByText("Sending OTP...")).toBeTruthy();
    release({ status: 422, body: { success: false } });
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter 13-digit account number")).toBeTruthy();
  });

  it("stays on the OTP step on a wrong code", async () => {
    replyWith({
      ...HAPPY,
      "/api/fifaworldcup/verify-otp": { status: 422, body: { success: false } },
    });
    render(<CardRequestFlow />);
    fireEvent.change(accountInput(), { target: { value: "1000123456789" } });
    fireEvent.click(sendButton());
    await screen.findByText("09******3344");
    fireEvent.change(screen.getByPlaceholderText("6-digit code"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /verify otp/i }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.getByPlaceholderText("6-digit code")).toBeTruthy();
  });

  it("shows insufficient balance and stays on the branch step", async () => {
    replyWith({
      ...HAPPY,
      "/api/fifaworldcup/customer-info": {
        body: { success: true, customerDetails: { ...CUSTOMER, availableFunds: "225" } },
      },
    });
    render(<CardRequestFlow />);
    await reachBranchStep();
    fireEvent.click(screen.getByRole("button", { name: "pick branch" }));
    fireEvent.click(screen.getByRole("button", { name: "continue" }));
    expect(await screen.findByText("Insufficient balance")).toBeTruthy();
    expect(screen.getByRole("button", { name: "continue" })).toBeTruthy();
    expect(screen.queryByText("Card request submitted.")).toBeNull();
    expect(fetchMock.mock.calls.some((c) => c[0] === "/api/fifaworldcup/card-request")).toBe(false);
  });

  it("tells the customer when they already have a card (CD012)", async () => {
    replyWith({
      ...HAPPY,
      "/api/fifaworldcup/card-request": {
        status: 503,
        body: { ResponseCode: "CD012", ResponseType: "Business Error" },
      },
    });
    render(<CardRequestFlow />);
    await reachBranchStep();
    fireEvent.click(screen.getByRole("button", { name: "pick branch" }));
    fireEvent.click(screen.getByRole("button", { name: "continue" }));
    expect(await screen.findByText("You have already requested a card!")).toBeTruthy();
    expect(screen.queryByText("Card request submitted.")).toBeNull();
  });
});
