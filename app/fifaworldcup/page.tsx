"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { ReusableStepper } from "@/components/CorporateForm/Stepper";
import { CreditCard, KeyRound, Landmark, Send } from "lucide-react";
import { BranchSelectorStep } from "@/components/BranchSelector/BranchSelectorStep";
import type { Branch } from "@/components/BranchSelector/types";
import { useFifaWorldCupToken } from "@/hooks/use-fifaworldcup-token";
import { maskPhoneForOtpHint } from "@/lib/fifaworldcup/maskPhoneNumber";
import {
  buildRequestNewCardBody,
  parseCustomerDetailsRecordForCard,
} from "@/lib/fifaworldcup/cardRequestUtils";
import {
  fifaToastError,
  fifaToastSomethingWrong,
  fifaToastSuccess,
} from "@/lib/fifaworldcup/fifaToast";
import { Toaster } from "react-hot-toast";
export default function FifaWorldCupPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [accountTouched, setAccountTouched] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  /** Raw phone from sendOtp success (`phoneNumber`); shown masked on OTP step. */
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmittingCardRequest, setIsSubmittingCardRequest] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Step 4: animate the success cup into the top header cup (repeats on an interval).
  const [cupFlyingToHeader, setCupFlyingToHeader] = useState(false);
  const [cupMovedToHeader, setCupMovedToHeader] = useState(false);
  const [cupFlightId, setCupFlightId] = useState(0);
  const [cupFrom, setCupFrom] = useState({ x: 0, y: 0 });
  const [cupDelta, setCupDelta] = useState({ dx: 0, dy: 0 });
  const headerCupRef = useRef<HTMLDivElement | null>(null);
  const successCupRef = useRef<HTMLDivElement | null>(null);
  const cupLoopTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearCupLoopTimers = useCallback(() => {
    cupLoopTimersRef.current.forEach((id) => clearTimeout(id));
    cupLoopTimersRef.current = [];
  }, []);

  const measureAndStartCupFlight = useCallback(() => {
    const tryMeasure = (attemptsLeft: number) => {
      const s = successCupRef.current;
      const h = headerCupRef.current;
      if (!s || !h) {
        if (attemptsLeft > 0) {
          const t = setTimeout(() => tryMeasure(attemptsLeft - 1), 80);
          cupLoopTimersRef.current.push(t);
        }
        return;
      }
      const sRect = s.getBoundingClientRect();
      const hRect = h.getBoundingClientRect();
      const sCenterX = sRect.left + sRect.width / 2;
      const sCenterY = sRect.top + sRect.height / 2;
      const hCenterX = hRect.left + hRect.width / 2;
      const hCenterY = hRect.top + hRect.height / 2;
      setCupFlightId((id) => id + 1);
      setCupFrom({ x: sCenterX, y: sCenterY });
      setCupDelta({ dx: hCenterX - sCenterX, dy: hCenterY - sCenterY });
      setCupFlyingToHeader(true);
    };
    tryMeasure(25);
  }, []);
  const steps = [
    "Account verification",
    "OTP verification",
    "Nearest branch selector",
    "Success",
  ];
  const slideImages = [
    "/CARD-TO-CUP/card-1.jpeg",
    "/CARD-TO-CUP/card-2.jpeg",
    "/CARD-TO-CUP/card-3.jpeg",
    "/CARD-TO-CUP/card-4.jpeg",
  ];

  /**
   * OAuth for FIFA flow: `ensureValidToken()` before send/verify so a fresh bearer is ready
   * (session + `/api/fifaworldcup/token` warms the server OAuth cache used by gateway routes).
   */
  const fifaWorldCupAuth = useFifaWorldCupToken({ enabled: !isLoading });

  useEffect(() => {
    if (fifaWorldCupAuth.error) {
      console.warn("[FIFA World Cup] OAuth token error:", fifaWorldCupAuth.error);
    }
  }, [fifaWorldCupAuth.error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const raw = searchParams.get("account");
    if (!raw) return;
    // Supports values like ?account=1010... or ?account="1010..."
    const normalized = raw.replace(/['"]/g, "").replace(/\D/g, "").slice(0, 13);
    if (!/^\d{13}$/.test(normalized)) return;
    setAccountNumber(normalized);
    setAccountTouched(false);
  }, [searchParams]);

  useEffect(() => {
    if (isLoading) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 2600);

    return () => clearInterval(slideTimer);
  }, [isLoading, slideImages.length]);

  useEffect(() => {
    if (activeStep !== 1) return;
    setOtpTimeLeft(180);

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
    if (activeStep !== 3) {
      clearCupLoopTimers();
      setCupFlyingToHeader(false);
      setCupMovedToHeader(false);
      return;
    }

    setCupFlyingToHeader(false);
    setCupMovedToHeader(false);

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => measureAndStartCupFlight());
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      clearCupLoopTimers();
      setCupFlyingToHeader(false);
    };
  }, [activeStep, clearCupLoopTimers, measureAndStartCupFlight]);

  useEffect(() => {
    if (activeStep !== 3) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  const formatOtpTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hasAccountError =
    accountTouched && (accountNumber.length !== 13 || !/^\d{13}$/.test(accountNumber));
  const canProceedAccount =
    accountNumber.length === 13 && /^\d{13}$/.test(accountNumber);

  const handleSendOtp = async () => {
    if (!canProceedAccount) return;
    setIsSendingOtp(true);
    try {
      const accessToken = await fifaWorldCupAuth.ensureValidToken();
      if (!accessToken) {
        fifaToastSomethingWrong();
        return;
      }
      const res = await fetch("/api/fifaworldcup/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accountNumber }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        success?: boolean;
        phoneNumber?: string;
      };
      if (!res.ok || data.success === false) {
        fifaToastSomethingWrong();
        return;
      }
      const phone =
        typeof data.phoneNumber === "string" ? data.phoneNumber.trim() : "";
      if (!phone) {
        fifaToastSomethingWrong();
        return;
      }
      setOtpPhoneNumber(phone);
      fifaToastSuccess("OTP sent successfully");
      setActiveStep(1);
    } catch {
      fifaToastSomethingWrong();
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpTimeLeft <= 0) return;
    if (!otpPhoneNumber) {
      fifaToastSomethingWrong();
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) return;

    setIsVerifyingOtp(true);
    try {
      const accessToken = await fifaWorldCupAuth.ensureValidToken();
      if (!accessToken) {
        fifaToastSomethingWrong();
        return;
      }
      const res = await fetch("/api/fifaworldcup/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phoneNumber: otpPhoneNumber,
          otpCode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        success?: boolean;
      };
      if (!res.ok || data.success === false) {
        fifaToastSomethingWrong();
        return;
      }
      fifaToastSuccess("Verified successfully");
      setActiveStep(2);
    } catch {
      fifaToastSomethingWrong();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSelectBranch = async () => {
    if (!selectedBranch) return;
    if (!/^\d{13}$/.test(accountNumber.replace(/\D/g, "").slice(0, 13))) {
      fifaToastSomethingWrong();
      return;
    }
    const acct = accountNumber.replace(/\D/g, "").slice(0, 13);
    setIsSubmittingCardRequest(true);
    try {
      const accessToken = await fifaWorldCupAuth.ensureValidToken();
      if (!accessToken) {
        fifaToastSomethingWrong();
        return;
      }
      const authHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
      const infoRes = await fetch(
        `/api/fifaworldcup/customer-info?accountId=${encodeURIComponent(acct)}`,
        { cache: "no-store", headers: authHeaders }
      );
      const infoJson = (await infoRes.json()) as {
        success?: boolean;
        step?: string;
        error?: string;
        customerDetails?: Record<string, unknown>;
      };
      if (!infoRes.ok || !infoJson.success) {
        console.error(
          "[FIFA card] customer-info failed (call this before card-request)",
          `step=${infoJson.step ?? "unknown"}`,
          `error=${infoJson.error ?? infoRes.statusText}`
        );
        fifaToastSomethingWrong();
        return;
      }
      const balanceRaw = infoJson.customerDetails?.balance;
      const balance =
        typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
          ? balanceRaw
          : typeof balanceRaw === "string"
            ? Number(balanceRaw.replace(/,/g, "").trim())
            : Number.NaN;
      if (!Number.isFinite(balance) || balance <= 120) {
        fifaToastError("Insufficient balance");
        return;
      }
      const normalized = parseCustomerDetailsRecordForCard(
        infoJson.customerDetails ?? {},
        acct
      );
      if (!normalized) {
        console.error("[FIFA card] could not compose prepaid payload from customerDetails");
        fifaToastSomethingWrong();
        return;
      }
      const composedPayload = buildRequestNewCardBody(normalized, selectedBranch);
      const specialCategoryIds = new Set([
        "6052",
        "6064",
        "6060",
        "6501",
        "6500",
        "1500",
        "6050",
      ]);
      const categoryIdRaw = infoJson.customerDetails?.categoryId;
      const categoryId =
        typeof categoryIdRaw === "string"
          ? categoryIdRaw.trim()
          : typeof categoryIdRaw === "number" && Number.isFinite(categoryIdRaw)
            ? String(categoryIdRaw)
            : "";
      composedPayload.CardProduct = specialCategoryIds.has(categoryId)
        ? "404"
        : "403";
      // Hard enforce branch-derived values from selector (never from customer/account info).
      composedPayload.BranchCode = selectedBranch.branchCode
        .trim()
        .replace(/^ET00/i, "");
      composedPayload.District = (selectedBranch.district ?? "").trim();
      const res = await fetch("/api/fifaworldcup/card-request", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          accountNumber: acct,
          branchId: selectedBranch.id,
          branchCode: selectedBranch.branchCode,
          district: selectedBranch.district ?? null,
          customerDetails: infoJson.customerDetails,
          // Keep preview payload for debugging, but server pipeline remains source of truth.
          composedPayload,
        }),
      });
      const cardResult = (await res.json()) as {
        success: boolean;
        step?: string;
        error?: string;
      };
      if (res.ok && cardResult.success) {
        fifaToastSuccess("Card request submitted successfully");
        setActiveStep(3);
      } else {
        console.error(
          "[FIFA card] flow failed",
          `step=${cardResult.step ?? "unknown"}`,
          `error=${cardResult.error ?? res.statusText}`,
          cardResult
        );
        fifaToastSomethingWrong();
      }
    } catch (err) {
      console.error("[FIFA card] card-request fetch threw", err);
      fifaToastSomethingWrong();
    } finally {
      setIsSubmittingCardRequest(false);
    }
  };

  const loaderContent = (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[#F2FEFF]">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(242,254,255,0.92)_42%,rgba(214,245,250,0.95)_78%)]"
        animate={{ opacity: [0.85, 1, 0.88] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-[140vh] w-[33.75rem] -translate-x-1/2 bg-gradient-to-b from-cyan-100/45 via-sky-200/25 to-transparent blur-3xl"
        animate={{ rotate: [-8, 8, -8], opacity: [0.28, 0.52, 0.28] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute h-[22.5rem] w-[22.5rem] rounded-full border-2 border-[#f4c542]/45"
          animate={{ scale: [0.84, 1.12], opacity: [0.42, 0] }}
          transition={{ duration: 2.3, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute h-[19.0625rem] w-[19.0625rem] rounded-full border-2 border-[#ffcf57]/42"
          animate={{ scale: [0.88, 1.1], opacity: [0.38, 0] }}
          transition={{
            duration: 2.3,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.45,
          }}
        />

        <motion.div
          animate={{
            y: [0, -14, 0],
            rotate: [0, 1.8, 0, -1.8, 0],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-300/25 blur-3xl"
            animate={{ opacity: [0.22, 0.5, 0.22], scale: [0.92, 1.1, 0.92] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-1/2 top-[5%] h-[68%] w-[22%] -translate-x-1/2 bg-gradient-to-b from-white/70 via-white/20 to-transparent blur-md"
            animate={{ opacity: [0.18, 0.55, 0.18], x: [-10, 10, -10] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <Image
            src="/CARD-TO-CUP/cup.png"
            alt="FIFA World Cup loader"
            width={250}
            height={250}
            className="relative h-auto w-[15.625rem] drop-shadow-[0_0_1.875rem_rgba(245,185,66,0.24)]"
            priority
          />
        </motion.div>
      </div>
    </main>
  );

  if (isLoading) {
    return loaderContent;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4fbff]">
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
      />
      <iframe
        src="/"
        title="Card homepage background"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] blur-[0.4375rem] brightness-[0.65] saturate-[0.9]"
      />
      {/* Modal background dim + glare (premium "glass" shine) */}
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

      {cupFlyingToHeader && (
        <motion.div
          key={cupFlightId}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: cupDelta.dx,
            y: cupDelta.dy,
            scale: 0.88,
            opacity: 1,
          }}
          transition={{ duration: 1.9, ease: "easeInOut" }}
          onAnimationComplete={() => {
            setCupFlyingToHeader(false);
            setCupMovedToHeader(true);
            const pauseAtHeaderMs = 2800;
            const pauseBeforeNextFlightMs = 900;
            const holdAtHeader = setTimeout(() => {
              setCupMovedToHeader(false);
              const prepNext = setTimeout(() => {
                window.requestAnimationFrame(() => {
                  window.requestAnimationFrame(() => measureAndStartCupFlight());
                });
              }, pauseBeforeNextFlightMs);
              cupLoopTimersRef.current.push(prepNext);
            }, pauseAtHeaderMs);
            cupLoopTimersRef.current.push(holdAtHeader);
          }}
          style={{
            position: "fixed",
            left: cupFrom.x,
            top: cupFrom.y,
            zIndex: 2000,
            pointerEvents: "none",
          }}
        >
          <div style={{ transform: "translate(-50%, -50%)" }}>
            <Image
              src="/CARD-TO-CUP/cup.png"
              alt="FIFA World Cup"
              width={58}
              height={58}
              priority
              className="drop-shadow-[0_0_1.125rem_rgba(245,185,66,0.35)]"
            />
          </div>
        </motion.div>
      )}

      <section className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sky-100">
          <>
              <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(242,254,255,0.95)_0%,#ffffff_70%)] px-4 pt-6 pb-0 md:px-7 md:pt-8">
                <motion.div
                  className="pointer-events-none absolute -left-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl"
                  animate={{ x: [0, 24, 0], opacity: [0.3, 0.62, 0.3] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute -right-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-amber-200/35 blur-3xl"
                  animate={{ x: [0, -24, 0], opacity: [0.28, 0.58, 0.28] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute top-0 left-[-35%] h-full w-[70%] rotate-6 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)]"
                  animate={{ x: [0, 260, 0], opacity: [0.2, 0.55, 0.2] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative mx-auto max-w-3xl px-4 py-4 md:px-8">
                  <div className="relative flex items-center justify-center gap-3 md:gap-6">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-[3.5rem] items-center"
                    >
                      <Image
                        src="/CARD-TO-CUP/cooplogo.png"
                        alt="Coop Bank of Oromia"
                        width={136}
                        height={32}
                        className="h-auto w-[6.5rem] md:w-[8.5rem]"
                        priority
                      />
                    </motion.div>

                    <div className="relative h-[0.125rem] w-10 overflow-hidden rounded-full bg-sky-100 md:w-16">
                      <motion.div
                        className="absolute inset-y-0 left-[-40%] w-[45%] bg-gradient-to-r from-transparent via-sky-500/70 to-transparent"
                        animate={{ x: ["0%", "220%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                      />
                    </div>

                    <motion.div
                      animate={
                        cupFlyingToHeader
                          ? { y: 0, rotate: 0 }
                          : { y: [0, -6, 0], rotate: [0, 1.2, 0, -1.2, 0] }
                      }
                      transition={{
                        duration: cupFlyingToHeader ? 0.01 : 3,
                        repeat: cupFlyingToHeader ? 0 : Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative flex h-[3.5rem] items-center"
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full bg-amber-300/30 blur-xl"
                        animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.92, 1.08, 0.92] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute -inset-2 rounded-full border border-amber-300/45"
                        animate={{ scale: [0.92, 1.08], opacity: [0.45, 0] }}
                        transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
                      />
                      <div
                        ref={headerCupRef}
                        style={{
                          opacity: cupFlyingToHeader ? 0 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        <Image
                          src="/CARD-TO-CUP/cup.png"
                          alt="FIFA World Cup"
                          width={72}
                          height={72}
                          className="relative h-auto w-[3.375rem] md:w-[4.5rem] drop-shadow-[0_0_1.375rem_rgba(245,185,66,0.45)]"
                          priority
                        />
                      </div>
                    </motion.div>

                    <div className="relative h-[0.125rem] w-10 overflow-hidden rounded-full bg-sky-100 md:w-16">
                      <motion.div
                        className="absolute inset-y-0 left-[-40%] w-[45%] bg-gradient-to-r from-transparent via-sky-500/70 to-transparent"
                        animate={{ x: ["0%", "220%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 0.2 }}
                      />
                    </div>

                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      className="flex h-[3.5rem] items-center"
                    >
                      <Image
                        src="/CARD-TO-CUP/visa.png"
                        alt="Visa"
                        width={136}
                        height={40}
                        className="h-auto w-[5.625rem] md:w-[8.5rem]"
                        priority
                      />
                    </motion.div>
                  </div>

                <motion.div
                  className="relative mt-5 text-center"
                  animate={{ opacity: [0.78, 1, 0.78] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <p className="text-sm font-extrabold tracking-[0.04em] text-transparent bg-clip-text bg-gradient-to-r from-[#00adef] via-[#00adef] to-[#1434cb] drop-shadow-[0_0.0625rem_0.625rem_rgba(20,52,203,0.25)] md:text-lg">
                    From Card to World Cup!
                  </p>
                  <Alert
                    severity="info"
                    sx={{
                      mt: 1.5,
                      width: "100%",
                      alignSelf: "stretch",
                      py: { xs: 0.75, sm: 1 },
                      "& .MuiAlert-message": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        lineHeight: { xs: 1.45, sm: 1.5 },
                      },
                      "& .MuiAlert-icon": {
                        fontSize: { xs: "1.15rem", sm: "1.35rem" },
                        mr: { xs: 0.75, sm: 1 },
                        alignSelf: "flex-start",
                        mt: { xs: "0.125rem", sm: 0 },
                      },
                    }}
                  >
                    Apply for your debit card by simply entering
                    your account number. If you do not have an account yet,
                    create one first and get your card instantly.
                  </Alert>
                </motion.div>

                <Box sx={{ mt: 3, width: "100%" }}>
                  <ReusableStepper steps={steps} activeStep={activeStep} />
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2.5,
                    backgroundColor: "#ffffff",
                    border: "0.0625rem solid #e0f2fe",
                  }}
                >
                  {activeStep === 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          className="flex items-center gap-2 text-gray-700"
                          sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          <CreditCard className="w-[1.125rem] h-[1.125rem] text-[#00adef]" />
                          Your Account Number
                        </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Enter 13-digit account number"
                        value={accountNumber}
                        disabled={isSendingOtp}
                        onBlur={() => setAccountTouched(true)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 13);
                          setAccountNumber(value);
                        }}
                        error={hasAccountError}
                        helperText={
                          hasAccountError
                            ? "Please enter a valid 13-digit customer account number"
                            : "Enter your 13-digit customer account number"
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Landmark className="w-5 h-5 text-gray-400" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#ffffff",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            "& fieldset": {
                              borderColor: "#e5e7eb",
                              borderWidth: "0.09375rem",
                            },
                            "&:hover fieldset": {
                              borderColor: "#00adef",
                              borderWidth: "0.09375rem",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#00adef",
                              borderWidth: "0.125rem",
                              boxShadow: "0 0 0 0.1875rem rgba(0, 173, 239, 0.1)",
                            },
                            height: { xs: "2.75rem", sm: "3rem" },
                            fontSize: { xs: "0.9375rem", sm: "1rem" },
                          },
                          "& .MuiFormHelperText-root": {
                            marginLeft: 0,
                            marginTop: 1,
                            fontSize: "0.75rem",
                            color: "#6b7280",
                          },
                        }}
                      />
                      </Box>

                      <Button
                        variant="contained"
                        onClick={handleSendOtp}
                        disabled={!canProceedAccount || isSendingOtp}
                        fullWidth
                        disableElevation
                        sx={{
                          height: { xs: "2.75rem", sm: "3rem" },
                          borderRadius: "0.75rem",
                          textTransform: "none",
                          fontSize: { xs: "0.9375rem", sm: "1rem" },
                          fontWeight: 600,
                          backgroundColor: "#00adef",
                          "&:hover": {
                            backgroundColor: "#4dc8f0",
                            transform: "translateY(-0.0625rem)",
                            boxShadow: "0 0.25rem 0.75rem rgba(0, 173, 239, 0.3)",
                          },
                          "&:active": {
                            backgroundColor: "#7dd3fc",
                            transform: "translateY(0)",
                          },
                          "&.Mui-disabled": {
                            background: "rgba(0, 173, 239, 0.3)",
                            color: "rgba(255, 255, 255, 0.7)",
                          },
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {isSendingOtp ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1.5,
                            }}
                          >
                            <CircularProgress
                              size={20}
                              thickness={4}
                              sx={{ color: "#ffffff", flexShrink: 0 }}
                            />
                            <span>Sending OTP...</span>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Send className="w-5 h-5" />
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
                          href="https://my.coopbankoromiasc.com/individualaccount?fifawordlcup"
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
                          variant="subtitle2"
                          className="flex items-center gap-2 text-gray-700"
                          sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          <KeyRound className="w-[1.125rem] h-[1.125rem] text-[#00adef]" />
                          OTP Code
                        </Typography>
                        {otpPhoneNumber ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontSize: { xs: "0.78rem", sm: "0.8125rem" },
                              lineHeight: 1.55,
                            }}
                          >
                            Enter the verification code sent to{" "}
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color: "#334155",
                                letterSpacing: "0.03em",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {maskPhoneForOtpHint(otpPhoneNumber)}
                            </Box>
                            .
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontSize: { xs: "0.78rem", sm: "0.8125rem" },
                              lineHeight: 1.55,
                            }}
                          >
                            Enter the verification code sent to your registered mobile
                            number.
                          </Typography>
                        )}

                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="6-digit code"
                        value={otpCode}
                        error={
                          otpTimeLeft > 0 &&
                          otpCode.length > 0 &&
                          otpCode.length < 6
                        }
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        helperText={
                          otpTimeLeft <= 0
                            ? "OTP expired. Please go back and request a new OTP."
                            : otpCode.length > 0 && otpCode.length < 6
                              ? `Enter all 6 digits · expires in ${formatOtpTime(otpTimeLeft)}`
                              : `OTP expires in ${formatOtpTime(otpTimeLeft)} · enter the 6-digit code`
                        }
                        inputProps={{
                          inputMode: "numeric",
                          maxLength: 6,
                          "aria-invalid":
                            otpTimeLeft > 0 &&
                            otpCode.length > 0 &&
                            otpCode.length < 6,
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#ffffff",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            "& fieldset": {
                              borderColor: "#e5e7eb",
                              borderWidth: "0.09375rem",
                            },
                            "&:hover fieldset": {
                              borderColor: "#00adef",
                              borderWidth: "0.09375rem",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#00adef",
                              borderWidth: "0.125rem",
                              boxShadow: "0 0 0 0.1875rem rgba(0, 173, 239, 0.1)",
                            },
                            height: { xs: "2.75rem", sm: "3rem" },
                            fontSize: { xs: "0.9375rem", sm: "1rem" },
                          },
                          "& .MuiFormHelperText-root": {
                            marginLeft: 0,
                            marginTop: 1,
                            fontSize: "0.75rem",
                            color: otpTimeLeft > 0 ? "#6b7280" : "#dc2626",
                            fontWeight: otpTimeLeft > 0 ? 400 : 600,
                          },
                        }}
                      />
                      </Box>

                      <Button
                        variant="contained"
                        onClick={() => void handleVerifyOtp()}
                        disabled={
                          !/^\d{6}$/.test(otpCode) ||
                          otpTimeLeft <= 0 ||
                          !otpPhoneNumber ||
                          isVerifyingOtp
                        }
                        fullWidth
                        disableElevation
                        sx={{
                          height: { xs: "2.75rem", sm: "3rem" },
                          borderRadius: "0.75rem",
                          textTransform: "none",
                          fontSize: { xs: "0.9375rem", sm: "1rem" },
                          fontWeight: 600,
                          backgroundColor: "#00adef",
                          "&:hover": {
                            backgroundColor: "#4dc8f0",
                            transform: "translateY(-0.0625rem)",
                            boxShadow: "0 0.25rem 0.75rem rgba(0, 173, 239, 0.3)",
                          },
                          "&:active": {
                            backgroundColor: "#7dd3fc",
                            transform: "translateY(0)",
                          },
                          "&.Mui-disabled": {
                            background: "rgba(0, 173, 239, 0.3)",
                            color: "rgba(255, 255, 255, 0.7)",
                          },
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {isVerifyingOtp ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1.5,
                            }}
                          >
                            <CircularProgress
                              size={20}
                              thickness={4}
                              sx={{ color: "#ffffff", flexShrink: 0 }}
                            />
                            <span>Verifying...</span>
                          </Box>
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                    </Box>
                  )}

                  {activeStep === 2 && (
                    <BranchSelectorStep
                      selectedBranch={selectedBranch}
                      onBranchSelect={setSelectedBranch}
                      onContinue={handleSelectBranch}
                      continueLoading={isSubmittingCardRequest}
                    />
                  )}

                  {activeStep === 3 && (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: { xs: 1.5, sm: 2.4 },
                        px: { xs: 0.5, sm: 1.2 },
                        borderRadius: "0.875rem",
                        border: "0.0625rem solid #dbeafe",
                        background:
                          "linear-gradient(180deg, rgba(242,254,255,0.95) 0%, rgba(255,255,255,1) 100%)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            width: 92,
                            height: 92,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <motion.div
                            className="absolute h-[5.5rem] w-[5.5rem] rounded-full border-2 border-[#f4c542]/55"
                            animate={{ scale: [0.95, 1.04], opacity: [0.45, 0] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute h-[4.125rem] w-[4.125rem] rounded-full border-2 border-[#f4c542]/48"
                            animate={{ scale: [0.96, 1.02], opacity: [0.28, 0] }}
                            transition={{
                              duration: 2.8,
                              repeat: Infinity,
                              ease: "easeOut",
                              delay: 0.55,
                            }}
                          />
                          <motion.div
                            className="relative"
                            animate={{
                              y: [0, -0.6, 0],
                              scale: [1, 1.004, 1],
                            }}
                            transition={{
                              duration: 4.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <motion.div
                            className="absolute inset-0 rounded-full bg-amber-300/22 blur-2xl"
                            animate={{ opacity: [0.12, 0.28, 0.12], scale: [0.93, 1.04, 0.93] }}
                            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                            className="absolute left-1/2 top-[5%] h-[68%] w-[22%] -translate-x-1/2 bg-gradient-to-b from-white/75 via-white/25 to-transparent blur-md"
                            animate={{ opacity: [0.18, 0.34, 0.18], x: [-3, 3, -3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                              className="relative"
                              animate={{
                                opacity: [0.88, 1, 0.9],
                                filter: [
                                  "drop-shadow(0 0 0.375rem rgba(245,185,66,0.26))",
                                  "drop-shadow(0 0 0.625rem rgba(245,185,66,0.34))",
                                  "drop-shadow(0 0 0.4375rem rgba(245,185,66,0.26))",
                                ],
                              }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <motion.div
                              className="relative grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border border-amber-200/90 bg-[radial-gradient(circle_at_50%_70%,#ffffff_0%,#fff8e8_32%,#f4c542_64%,#c9871b_100%)] shadow-[0_0_0.625rem_rgba(245,185,66,0.30)]"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <motion.div
                                className="absolute inset-[0.25rem] rounded-full border border-amber-100/70"
                                  animate={{ opacity: [0.25, 0.55, 0.25] }}
                                  transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                className="absolute left-[15%] top-[14%] h-[30%] w-[15%] rounded-full bg-white/80 blur-[0.0625rem]"
                                animate={{ opacity: [0.28, 0.55, 0.28], scale: [1, 1.03, 1] }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                />
                              <div
                                ref={successCupRef}
                                style={{ opacity: cupMovedToHeader || cupFlyingToHeader ? 0 : 1 }}
                                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center drop-shadow-[0_0_1.125rem_rgba(245,185,66,0.35)]"
                              >
                                <Image
                                  src="/CARD-TO-CUP/cup.png"
                                  alt="FIFA World Cup"
                                  width={58}
                                  height={58}
                                  priority
                                  className="relative"
                                />
                              </div>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                        </Box>
                      </Box>

                      <Typography
                        sx={{
                          fontSize: { xs: "1.05rem", sm: "1.24rem" },
                          fontWeight: 800,
                          backgroundImage:
                            "linear-gradient(90deg, #f4c542 0%, #c9871b 45%, #00adef 120%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                          textShadow: "0 0 1.375rem rgba(245,185,66,0.18)",
                        }}
                      >
                        Successfully submitted.
                      </Typography>
                      <Typography
                        sx={{
                          mt: 1,
                          color: "#475569",
                          fontSize: { xs: "0.9rem", sm: "0.95rem" },
                          lineHeight: 1.62,
                          maxWidth: 620,
                          mx: "auto",
                        }}
                      >
                        Thank you for joining the Card to World Cup experience. Your
                        card will be ready soon, and our team will keep in touch with
                        you on the next steps.
                        {selectedBranch
                          ? ` Please visit ${selectedBranch.companyName || "your selected branch"} to collect your card once it is prepared.`
                          : " Please visit your selected branch to collect your card once it is prepared."}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 1.1,
                          fontSize: { xs: "0.83rem", sm: "0.88rem" },
                          color: "#00adef",
                          fontWeight: 700,
                        }}
                      >
                        Need assistance? Call 609 now.
                      </Typography>
                    </Box>
                  )}
                </Box>

                {activeStep !== 2 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: "0.875rem",
                        overflow: "hidden",
                        border: "0.0625rem solid #dbeafe",
                        background:
                          "linear-gradient(135deg, rgba(0,173,239,0.08) 0%, rgba(20,52,203,0.06) 100%)",
                        height: { xs: 165, sm: 210 },
                      }}
                    >
                      {slideImages.map((src, index) => (
                        <motion.div
                          key={src}
                          initial={false}
                          animate={{
                            opacity: currentSlide === index ? 1 : 0,
                            scale: currentSlide === index ? 1.08 : 1.16,
                          }}
                          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0"
                          style={{
                            pointerEvents: "none",
                            transformOrigin: "center center",
                            willChange: "transform, opacity",
                          }}
                        >
                          <Image
                            src={src}
                            alt={`Card slide ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 40rem) 100vw, 45rem"
                            priority={index === 0}
                          />
                        </motion.div>
                      ))}

                      <Box
                        sx={{
                          position: "absolute",
                          left: "50%",
                          bottom: 10,
                          transform: "translateX(-50%)",
                          display: "flex",
                          gap: 0.75,
                          px: 1,
                          py: 0.5,
                          borderRadius: "999rem",
                          background: "rgba(15, 23, 42, 0.25)",
                          backdropFilter: "blur(0.375rem)",
                        }}
                      >
                        {slideImages.map((_, index) => (
                          <Box
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "999rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              backgroundColor:
                                currentSlide === index
                                  ? "#00adef"
                                  : "rgba(255,255,255,0.65)",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 1.5,
                    mx: { xs: "-1rem", md: "-1.75rem" },
                    py: 0.75,
                    borderTop: "0.0625rem solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "0.64rem", sm: "0.68rem" },
                      color: "#64748b",
                    }}
                  >
                    © {new Date().getFullYear()} Cooperative Bank of Oromia. All
                    rights reserved.
                  </Typography>
                </Box>
                </div>
              </section>
          </>
        </div>
      </section>
    </main>
  );
}
