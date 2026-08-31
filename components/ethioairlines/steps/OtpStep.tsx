"use client";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { ArrowLeft, KeyRound, RotateCw, ShieldCheck } from "lucide-react";
import {
  numericFieldSx,
  primaryButtonSx,
  textButtonSx,
} from "@/lib/ethioairlines/checkoutFieldStyles";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type OtpStepProps = {
  otpCode: string;
  onOtpCodeChange: (value: string) => void;
  maskedPhone: string;
  timeLeft: number;
  isVerifying: boolean;
  isResending: boolean;
  canVerify: boolean;
  canResend: boolean;
  onSubmit: () => void;
  onResend: () => void;
  onChangeAccount: () => void;
};

export default function OtpStep({
  otpCode,
  onOtpCodeChange,
  maskedPhone,
  timeLeft,
  isVerifying,
  isResending,
  canVerify,
  canResend,
  onSubmit,
  onResend,
  onChangeAccount,
}: OtpStepProps) {
  const expired = timeLeft <= 0;

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canVerify && !isVerifying) onSubmit();
      }}
      className="space-y-4"
    >
      <p className="text-[0.875rem] leading-relaxed text-slate-600">
        Enter the 6-digit code sent to{" "}
        <span className="font-semibold tabular-nums text-slate-800">
          {maskedPhone}
        </span>
        .
      </p>

      <TextField
        fullWidth
        label="Verification code"
        value={otpCode}
        onChange={(e) =>
          onOtpCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        error={expired}
        disabled={isVerifying}
        placeholder="Enter the code"
        helperText={
          expired
            ? "This code has expired. Request a new one."
            : `Expires in ${formatTime(timeLeft)}`
        }
        slotProps={{ formHelperText: { "aria-live": "polite" } }}
        inputProps={{
          inputMode: "numeric",
          enterKeyHint: "go",
          maxLength: 6,
          autoComplete: "one-time-code",
          "aria-label": "6-digit verification code",
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyRound size={18} className="text-slate-400" />
            </InputAdornment>
          ),
        }}
        sx={{
          ...numericFieldSx,
          "& .MuiOutlinedInput-input": {
            letterSpacing: "0.5em",
            fontWeight: 600,
            // The wide tracking is for the 6 digits. The placeholder is prose,
            // so reset it or "Enter the code" stretches past the field.
            "&::placeholder": {
              letterSpacing: "normal",
              fontWeight: 500,
            },
          },
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={!canVerify || isVerifying}
        sx={primaryButtonSx}
      >
        {isVerifying ? (
          <>
            <CircularProgress size={20} thickness={4} color="inherit" />
            Verifying…
          </>
        ) : (
          <>
            <ShieldCheck size={17} />
            Verify
          </>
        )}
      </Button>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          onClick={onChangeAccount}
          disabled={isVerifying || isResending}
          sx={{ ...textButtonSx, color: "#64748b" }}
          startIcon={<ArrowLeft size={15} />}
        >
          Change account
        </Button>

        <Button
          type="button"
          onClick={onResend}
          disabled={!canResend || isResending || isVerifying}
          sx={textButtonSx}
          startIcon={
            isResending ? (
              <CircularProgress size={14} thickness={4} color="inherit" />
            ) : (
              <RotateCw size={15} />
            )
          }
        >
          {isResending
            ? "Sending…"
            : canResend
              ? "Resend code"
              : `Resend in ${formatTime(Math.max(0, timeLeft - 120))}`}
        </Button>
      </div>
    </Box>
  );
}
