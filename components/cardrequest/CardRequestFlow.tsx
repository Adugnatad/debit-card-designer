"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, CreditCard, KeyRound, Landmark, Send } from "lucide-react";
import { ReusableStepper } from "@/components/CorporateForm/Stepper";
import { BranchSelectorStep } from "@/components/BranchSelector/BranchSelectorStep";
import type { Branch } from "@/components/BranchSelector/types";
import {
  cardRequestToastError,
  cardRequestToastSuccess,
} from "@/lib/cardrequest/cardRequestToast";
import {
  maskPhoneForOtpHint,
  sendOtp,
  submitCardRequest,
  verifyOtp,
} from "@/lib/cardrequest/cardRequestApi";

const STEPS = [
  "Account verification",
  "OTP verification",
  "Branch selection",
  "Success",
];
const OTP_TTL_SECONDS = 180;
/** Same onboarding link (including its query tag) as the campaign page, by decision. */
const OPEN_ACCOUNT_URL = "https://my.coopbankoromiasc.com/individualaccount?fifawordlcup";
const ACCENT = "#00adef";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#ffffff",
    "& fieldset": { borderColor: "#e5e7eb", borderWidth: "0.09375rem" },
    "&:hover fieldset": { borderColor: ACCENT },
    "&.Mui-focused fieldset": {
      borderColor: ACCENT,
      borderWidth: "0.125rem",
      boxShadow: "0 0 0 0.1875rem rgba(0, 173, 239, 0.1)",
    },
    height: { xs: "2.75rem", sm: "3rem" },
    fontSize: { xs: "0.9375rem", sm: "1rem" },
  },
  "& .MuiFormHelperText-root": { marginLeft: 0, marginTop: 1, fontSize: "0.75rem" },
} as const;

const primaryButtonSx = {
  height: { xs: "2.75rem", sm: "3rem" },
  borderRadius: "0.75rem",
  textTransform: "none",
  fontSize: { xs: "0.9375rem", sm: "1rem" },
  fontWeight: 600,
  backgroundColor: ACCENT,
  "&:hover": { backgroundColor: "#4dc8f0" },
  "&.Mui-disabled": {
    background: "rgba(0, 173, 239, 0.3)",
    color: "rgba(255, 255, 255, 0.7)",
  },
} as const;

function formatOtpTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function ButtonBusy({ label }: { label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <CircularProgress size={20} thickness={4} sx={{ color: "#ffffff" }} />
      <span>{label}</span>
    </Box>
  );
}

export type CardRequestFlowProps = {
  /** Pre-validated 13-digit account from `?account=`, or empty. */
  initialAccount?: string;
};

export default function CardRequestFlow({ initialAccount = "" }: CardRequestFlowProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [accountNumber, setAccountNumber] = useState(initialAccount);
  const [accountTouched, setAccountTouched] = useState(false);
  /** Phone the OTP was sent to; verify-otp needs it (masked in the UI). */
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeStep !== 1) return;
    setOtpTimeLeft(OTP_TTL_SECONDS);
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 3) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  const accountValid = /^\d{13}$/.test(accountNumber);
  const hasAccountError = accountTouched && !accountValid;

  const restart = () => {
    setOtpPhoneNumber(null);
    setOtpCode("");
    setSelectedBranch(null);
    setActiveStep(0);
  };

  const handleSendOtp = async () => {
    if (!accountValid) return;
    setIsSendingOtp(true);
    try {
      const phone = await sendOtp(accountNumber);
      if (!phone) {
        cardRequestToastError();
        return;
      }
      setOtpPhoneNumber(phone);
      setOtpCode("");
      cardRequestToastSuccess("OTP sent successfully");
      setActiveStep(1);
    } catch {
      cardRequestToastError();
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpTimeLeft <= 0 || !otpPhoneNumber || !/^\d{6}$/.test(otpCode)) return;
    setIsVerifyingOtp(true);
    try {
      if (!(await verifyOtp(otpPhoneNumber, otpCode))) {
        cardRequestToastError();
        return;
      }
      cardRequestToastSuccess("Verified successfully");
      setActiveStep(2);
    } catch {
      cardRequestToastError();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBranch || !accountValid) return;
    setIsSubmitting(true);
    try {
      const result = await submitCardRequest(accountNumber, selectedBranch);
      if (result.ok) {
        cardRequestToastSuccess("Card request submitted successfully");
        setActiveStep(3);
      } else if (result.reason === "insufficient_balance") {
        cardRequestToastError("Insufficient balance");
      } else if (result.reason === "already_has_card") {
        cardRequestToastError("You have already requested a card!");
      } else {
        cardRequestToastError();
      }
    } catch (err) {
      console.error("[card-request] submit threw", err);
      cardRequestToastError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4fbff]">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      {/* The card website itself, blurred and dimmed behind the modal. */}
      <iframe
        src="/"
        title="Card homepage background"
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] blur-[0.4375rem] brightness-[0.65] saturate-[0.9]"
      />
      <div className="absolute inset-0 bg-slate-900/78" />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,173,239,0.22)_0%,rgba(0,173,239,0.10)_34%,transparent_62%)]"
        animate={{ opacity: [0.35, 0.55, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-0 left-[-35%] h-full w-[70%] rotate-6 bg-[linear-gradient(90deg,transparent_0%,rgba(0,173,239,0.16)_45%,rgba(0,173,239,0.07)_60%,transparent_100%)] blur-[0.0625rem]"
        animate={{ x: [0, 260, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sky-100">
          <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image
                src="/images/coop-logo.png"
                alt="Cooperative Bank of Oromia"
                width={136}
                height={40}
                className="h-auto w-[6.5rem] md:w-[8.5rem]"
                priority
              />
              <Typography
                component="h1"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.35rem" }, fontWeight: 800, color: ACCENT }}
              >
                Request a Debit Card
              </Typography>
            </div>

            <Alert
              severity="info"
              sx={{
                mt: 2,
                "& .MuiAlert-message": { fontSize: { xs: "0.75rem", sm: "0.875rem" } },
              }}
            >
              Apply for your debit card by entering your account number. We will
              verify it is you with a code sent to your registered phone, then you
              choose the branch where you will collect your card.
            </Alert>

            <Box sx={{ mt: 3 }}>
              <ReusableStepper steps={STEPS} activeStep={activeStep} />
            </Box>

            <Box
              sx={{
                mt: 3,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                border: "0.0625rem solid #e0f2fe",
              }}
            >
              {activeStep === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography
                      component="label"
                      htmlFor="card-request-account"
                      className="flex items-center gap-2 text-gray-700"
                      sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      <CreditCard className="h-[1.125rem] w-[1.125rem] text-[#00adef]" />
                      Your Account Number
                    </Typography>
                    <TextField
                      id="card-request-account"
                      fullWidth
                      size="small"
                      placeholder="Enter 13-digit account number"
                      value={accountNumber}
                      disabled={isSendingOtp}
                      onBlur={() => setAccountTouched(true)}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 13))
                      }
                      error={hasAccountError}
                      helperText={
                        hasAccountError
                          ? "Please enter a valid 13-digit customer account number"
                          : "Enter your 13-digit customer account number"
                      }
                      inputProps={{ inputMode: "numeric" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Landmark className="h-5 w-5 text-gray-400" />
                          </InputAdornment>
                        ),
                      }}
                      sx={fieldSx}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => void handleSendOtp()}
                    disabled={!accountValid || isSendingOtp}
                    fullWidth
                    disableElevation
                    sx={primaryButtonSx}
                  >
                    {isSendingOtp ? (
                      <ButtonBusy label="Sending OTP..." />
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Send className="h-5 w-5" />
                        <span>Send OTP</span>
                      </Box>
                    )}
                  </Button>

                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "center",
                      color: "#000000",
                      fontSize: { xs: "0.85rem", sm: "0.92rem" },
                      fontWeight: 700,
                      mt: 0.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: "0.625rem",
                      backgroundColor: "#e0f2fe",
                    }}
                  >
                    Don&apos;t have a coop bank account?{" "}
                    <Box
                      component="a"
                      href={OPEN_ACCOUNT_URL}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        color: "#15803d",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "0.1875rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        transition: "all 0.2s ease",
                        display: "inline",
                        "&:hover": {
                          color: "#166534",
                        },
                      }}
                    >
                      Click here
                    </Box>
                  </Typography>
                </Box>
              )}

              {activeStep === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography
                      component="label"
                      htmlFor="card-request-otp"
                      className="flex items-center gap-2 text-gray-700"
                      sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      <KeyRound className="h-[1.125rem] w-[1.125rem] text-[#00adef]" />
                      OTP Code
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {otpPhoneNumber ? (
                        <>
                          Enter the verification code sent to{" "}
                          <Box component="span" sx={{ fontWeight: 700, color: "#334155" }}>
                            {maskPhoneForOtpHint(otpPhoneNumber)}
                          </Box>
                          .
                        </>
                      ) : (
                        "Enter the verification code sent to your registered mobile number."
                      )}
                    </Typography>
                    <TextField
                      id="card-request-otp"
                      fullWidth
                      size="small"
                      placeholder="6-digit code"
                      value={otpCode}
                      error={otpTimeLeft <= 0 || (otpCode.length > 0 && otpCode.length < 6)}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      helperText={
                        otpTimeLeft <= 0
                          ? "OTP expired. Please request a new code."
                          : `OTP expires in ${formatOtpTime(otpTimeLeft)} · enter the 6-digit code`
                      }
                      inputProps={{ inputMode: "numeric", maxLength: 6 }}
                      sx={fieldSx}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => void handleVerifyOtp()}
                    disabled={!/^\d{6}$/.test(otpCode) || otpTimeLeft <= 0 || isVerifyingOtp}
                    fullWidth
                    disableElevation
                    sx={primaryButtonSx}
                  >
                    {isVerifyingOtp ? <ButtonBusy label="Verifying..." /> : "Verify OTP"}
                  </Button>
                  <Button
                    variant="text"
                    onClick={restart}
                    disabled={isVerifyingOtp}
                    sx={{ textTransform: "none", color: ACCENT }}
                  >
                    Request a new code
                  </Button>
                </Box>
              )}

              {activeStep === 2 && (
                <BranchSelectorStep
                  selectedBranch={selectedBranch}
                  onBranchSelect={setSelectedBranch}
                  onContinue={handleSubmit}
                  continueLoading={isSubmitting}
                />
              )}

              {activeStep === 3 && (
                <Box sx={{ textAlign: "center", py: { xs: 1.5, sm: 2.4 } }}>
                  <CheckCircle2 className="mx-auto h-16 w-16 text-[#00adef]" aria-hidden />
                  <Typography sx={{ mt: 1.5, fontSize: { xs: "1.05rem", sm: "1.24rem" }, fontWeight: 800 }}>
                    Card request submitted.
                  </Typography>
                  <Typography
                    sx={{ mt: 1, color: "#475569", lineHeight: 1.62, maxWidth: 620, mx: "auto" }}
                  >
                    Your card will be ready soon, and our team will keep in touch with
                    you on the next steps. Please visit{" "}
                    {selectedBranch?.companyName || "your selected branch"} to collect
                    your card once it is prepared.
                  </Typography>
                  <Typography sx={{ mt: 1.1, color: ACCENT, fontWeight: 700 }}>
                    Need assistance? Call 609 now.
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2, pt: 1, borderTop: "0.0625rem solid #e5e7eb", textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.68rem", color: "#64748b" }}>
                © {new Date().getFullYear()} Cooperative Bank of Oromia. All rights reserved.
              </Typography>
            </Box>
          </div>
        </div>
      </section>
    </main>
  );
}
