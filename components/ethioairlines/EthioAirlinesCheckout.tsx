"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { useMediaQuery, useTheme } from "@mui/material";
import { CheckCircle2, KeyRound, Landmark, ReceiptText } from "lucide-react";

import CheckoutStepper from "./CheckoutStepper";
import CheckoutHeader from "./CheckoutHeader";
import CheckoutFooter from "./CheckoutFooter";
import OrderSummaryCard from "./OrderSummaryCard";
import AccountStep from "./steps/AccountStep";
import OtpStep from "./steps/OtpStep";
import ConfirmStep from "./steps/ConfirmStep";
import SuccessStep from "./steps/SuccessStep";

import { useEthioAirlinesToken } from "@/hooks/use-ethioairlines-token";
import { generateEthioAirlinesMessageId } from "@/lib/ethioairlines/messageId";
import { maskPhoneForOtpHint } from "@/lib/fifaworldcup/maskPhoneNumber";
import {
  airlineToastError,
  airlineToastSomethingWrong,
  airlineToastSuccess,
} from "@/lib/ethioairlines/airlineToast";
import {
  BANK_NAME,
  PAGE_BG,
  PRIMARY_ACCENT,
  PRIMARY_ACCENT_SOFT,
  resolveReturnUrl,
} from "@/lib/ethioairlines/brandAssets";

const STEPS = ["Account", "Verification", "Confirm", "Done"];
const OTP_TTL_SECONDS = 180;
const RESEND_AFTER_SECONDS = 60;

const STEP_META = [
  {
    icon: Landmark,
    title: "Pay from your account",
    subtitle: "We'll send a verification code to your registered phone.",
  },
  {
    icon: KeyRound,
    title: "Verify it's you",
    subtitle: "Enter the code we just sent by SMS.",
  },
  {
    icon: ReceiptText,
    title: "Review and confirm",
    subtitle: "Check the details before authorising the payment.",
  },
  { icon: CheckCircle2, title: "All done", subtitle: "" },
];

type Receipt = {
  transactionRef?: string | null;
  amount?: string | null;
  redirectUrl?: unknown;
  completedAt: number;
};

export type EthioAirlinesCheckoutProps = {
  checkoutKey: string;
  bookingRef: string | null;
  expiresAtMs: number | null;
  initialAccount: string | null;
};

export default function EthioAirlinesCheckout({
  checkoutKey,
  bookingRef,
  expiresAtMs,
  initialAccount,
}: EthioAirlinesCheckoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [accountNumber, setAccountNumber] = useState(initialAccount ?? "");
  const [accountTouched, setAccountTouched] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [otpRound, setOtpRound] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Generated once on the first confirm attempt and reused for every retry.
   * Regenerating per click would turn a network timeout plus a user retry into
   * a duplicate transaction.
   */
  const messageIdRef = useRef<string | null>(null);

  const auth = useEthioAirlinesToken({ enabled: true });

  const canProceedAccount = /^\d{13}$/.test(accountNumber);
  const canVerify =
    /^\d{6}$/.test(otpCode) && otpTimeLeft > 0 && !!otpPhoneNumber;
  const canResend = otpTimeLeft <= OTP_TTL_SECONDS - RESEND_AFTER_SECONDS;
  const maskedPhone = otpPhoneNumber ? maskPhoneForOtpHint(otpPhoneNumber) : "";

  // The key is a bearer credential for the booking: keep it out of browser
  // history and out of the Referer header on any outbound link.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("key")) {
      url.searchParams.delete("key");
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, []);

  useEffect(() => {
    if (activeStep !== 1) return;
    setOtpTimeLeft(OTP_TTL_SECONDS);
    const id = setInterval(() => {
      setOtpTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [activeStep, otpRound]);

  useEffect(() => {
    if (activeStep === 3 && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeStep]);

  const authorizedFetch = useCallback(
    async (url: string, body: unknown) => {
      const token = await auth.ensureValidToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      return { res, data };
    },
    [auth]
  );

  const requestOtp = useCallback(
    async (mode: "send" | "resend") => {
      const setBusy = mode === "send" ? setIsSendingOtp : setIsResendingOtp;
      setBusy(true);
      try {
        const { res, data } = await authorizedFetch(
          "/api/ethioairlines/send-otp",
          { accountNumber }
        );

        if (!res.ok || data.success !== true) {
          const message =
            typeof data.message === "string" ? data.message : null;
          if (message) airlineToastError(message);
          else airlineToastSomethingWrong();
          return;
        }

        const phone =
          typeof data.phoneNumber === "string" ? data.phoneNumber : "";
        if (!phone) {
          airlineToastSomethingWrong();
          return;
        }

        setOtpPhoneNumber(phone);
        setOtpCode("");
        airlineToastSuccess(
          mode === "send"
            ? "Verification code sent"
            : "A new code is on its way"
        );

        if (mode === "send") setActiveStep(1);
        else setOtpRound((n) => n + 1);
      } catch {
        airlineToastSomethingWrong();
      } finally {
        setBusy(false);
      }
    },
    [accountNumber, authorizedFetch]
  );

  const handleVerifyOtp = useCallback(async () => {
    if (!otpPhoneNumber) {
      airlineToastSomethingWrong();
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const { res, data } = await authorizedFetch(
        "/api/ethioairlines/verify-otp",
        { phoneNumber: otpPhoneNumber, otpCode }
      );

      if (!res.ok || data.success !== true) {
        const message = typeof data.message === "string" ? data.message : null;
        if (message) airlineToastError(message);
        else airlineToastSomethingWrong();
        return;
      }

      setActiveStep(2);
    } catch {
      airlineToastSomethingWrong();
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [authorizedFetch, otpCode, otpPhoneNumber]);

  const handleConfirm = useCallback(async () => {
    if (isConfirming) return;
    messageIdRef.current ??= generateEthioAirlinesMessageId();

    setIsConfirming(true);
    try {
      const { res, data } = await authorizedFetch("/api/ethioairlines/confirm", {
        key: checkoutKey,
        messageId: messageIdRef.current,
        debitAccount: accountNumber,
      });

      if (!res.ok || data.success !== true) {
        const message = typeof data.message === "string" ? data.message : null;
        if (message) airlineToastError(message);
        else airlineToastSomethingWrong();
        return;
      }

      setReceipt({
        transactionRef:
          typeof data.transactionRef === "string" ? data.transactionRef : null,
        amount:
          typeof data.amount === "string"
            ? data.amount
            : typeof data.amount === "number"
              ? String(data.amount)
              : null,
        redirectUrl: data.redirectUrl,
        completedAt: Date.now(),
      });
      setActiveStep(3);
    } catch {
      airlineToastSomethingWrong();
    } finally {
      setIsConfirming(false);
    }
  }, [accountNumber, authorizedFetch, checkoutKey, isConfirming]);

  const handleChangeAccount = useCallback(() => {
    setActiveStep(0);
    setOtpCode("");
    setOtpPhoneNumber(null);
    setOtpTimeLeft(0);
  }, []);

  const meta = STEP_META[activeStep];
  const StepIcon = meta.icon;

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: PAGE_BG }}
    >
      <Toaster position={isMobile ? "top-center" : "top-right"} />

      {/* Header, stepper and card travel together as one block, centered in the
          leftover height on desktop rather than the header pinning to the top. */}
      <div className="flex flex-1 flex-col lg:justify-center">
        <CheckoutHeader />

        <div className="px-4">
          <div className="mx-auto w-full max-w-4xl bg-white px-4 pb-1 pt-2">
            <div className="mx-auto w-full max-w-md px-8 sm:px-4">
              <CheckoutStepper steps={STEPS} activeStep={activeStep} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-4xl items-start gap-5 px-4 py-5 md:py-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-5">

          <motion.section
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 sm:p-6"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e0f2fe",
              borderRadius: "1rem",
            }}
          >
            {activeStep !== 3 && (
              <div className="mb-4 flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: PRIMARY_ACCENT_SOFT }}
                >
                  <StepIcon size={17} style={{ color: PRIMARY_ACCENT }} />
                </span>
                <div className="min-w-0">
                  <h1
                    className="text-[1rem] font-bold leading-tight"
                    style={{ color: PRIMARY_ACCENT }}
                  >
                    {meta.title}
                  </h1>
                  <p className="mt-0.5 text-[0.8125rem] text-slate-500">
                    {meta.subtitle}
                  </p>
                </div>
              </div>
            )}

            {activeStep === 0 && (
              <AccountStep
                accountNumber={accountNumber}
                onAccountNumberChange={setAccountNumber}
                touched={accountTouched}
                onBlur={() => setAccountTouched(true)}
                isSending={isSendingOtp}
                canSubmit={canProceedAccount}
                onSubmit={() => void requestOtp("send")}
              />
            )}

            {activeStep === 1 && (
              <OtpStep
                otpCode={otpCode}
                onOtpCodeChange={setOtpCode}
                maskedPhone={maskedPhone}
                timeLeft={otpTimeLeft}
                isVerifying={isVerifyingOtp}
                isResending={isResendingOtp}
                canVerify={canVerify}
                canResend={canResend}
                onSubmit={() => void handleVerifyOtp()}
                onResend={() => void requestOtp("resend")}
                onChangeAccount={handleChangeAccount}
              />
            )}

            {activeStep === 2 && (
              <ConfirmStep
                accountNumber={accountNumber}
                maskedPhone={maskedPhone}
                bookingRef={bookingRef}
                isConfirming={isConfirming}
                onSubmit={() => void handleConfirm()}
                onBack={handleChangeAccount}
              />
            )}

            {activeStep === 3 && (
              <SuccessStep
                accountNumber={accountNumber}
                bookingRef={bookingRef}
                messageId={messageIdRef.current}
                transactionRef={receipt?.transactionRef}
                amount={receipt?.amount}
                completedAt={receipt?.completedAt ?? null}
                returnUrl={resolveReturnUrl(receipt?.redirectUrl)}
              />
            )}
          </motion.section>

          <div>
            <OrderSummaryCard
              bookingRef={bookingRef}
              expiresAtMs={expiresAtMs}
              amount={receipt?.amount}
            />
          </div>
        </div>

        <p className="mx-auto w-full max-w-4xl px-5 pb-5 text-center text-[0.75rem] leading-relaxed text-slate-400">
          {BANK_NAME} will never ask you for your OTP by phone or email.
        </p>
      </div>

      <CheckoutFooter />
    </main>
  );
}
