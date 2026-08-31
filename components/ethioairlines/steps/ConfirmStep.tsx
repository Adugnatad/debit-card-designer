"use client";

import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { Lock } from "lucide-react";
import {
  primaryButtonSx,
  textButtonSx,
} from "@/lib/ethioairlines/checkoutFieldStyles";
import { AIRLINE_NAME, BANK_NAME } from "@/lib/ethioairlines/brandAssets";

/** Shows only the last four digits of the account. */
function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return `${"•".repeat(account.length - 4)}${account.slice(-4)}`;
}

export type ConfirmStepProps = {
  accountNumber: string;
  maskedPhone: string;
  bookingRef: string | null;
  amount?: string | null;
  isConfirming: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

export default function ConfirmStep({
  accountNumber,
  maskedPhone,
  bookingRef,
  amount,
  isConfirming,
  onSubmit,
  onBack,
}: ConfirmStepProps) {
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: "Merchant", value: AIRLINE_NAME },
    ...(bookingRef
      ? [{ label: "Reference", value: bookingRef, mono: true }]
      : []),
    { label: "Debit account", value: maskAccount(accountNumber), mono: true },
    { label: "Verified phone", value: maskedPhone, mono: true },
    ...(amount?.trim() ? [{ label: "Amount", value: amount.trim() }] : []),
  ];

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isConfirming) onSubmit();
      }}
      className="space-y-4"
    >
      <div className="rounded-xl bg-[#f8fafc] p-3.5">
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="shrink-0 text-[0.75rem] uppercase tracking-wide text-slate-400">
                {row.label}
              </dt>
              <dd
                className={`text-right text-[0.8125rem] font-semibold text-slate-700 ${
                  row.mono ? "font-mono tabular-nums" : ""
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Alert
        severity="info"
        sx={{
          borderRadius: "0.75rem",
          fontSize: "0.8125rem",
          alignItems: "center",
          "& .MuiAlert-message": { py: 0.25 },
        }}
      >
        You are authorising {BANK_NAME} to debit this account and complete your
        payment to {AIRLINE_NAME}.
      </Alert>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isConfirming}
        sx={primaryButtonSx}
      >
        {isConfirming ? (
          <>
            <CircularProgress size={20} thickness={4} color="inherit" />
            Confirming payment…
          </>
        ) : (
          <>
            <Lock size={16} />
            Confirm payment
          </>
        )}
      </Button>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={onBack}
          disabled={isConfirming}
          sx={{ ...textButtonSx, color: "#64748b" }}
        >
          Use a different account
        </Button>
      </div>
    </Box>
  );
}
