"use client";

import { Button } from "@mui/material";
import { motion } from "framer-motion";
import { Check, ExternalLink, Printer } from "lucide-react";
import {
  primaryButtonSx,
  textButtonSx,
} from "@/lib/ethioairlines/checkoutFieldStyles";
import {
  AIRLINE_NAME,
  PRIMARY_ACCENT,
  PRIMARY_ACCENT_SOFT,
} from "@/lib/ethioairlines/brandAssets";

function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  return `${"•".repeat(account.length - 4)}${account.slice(-4)}`;
}

export type SuccessStepProps = {
  accountNumber: string;
  bookingRef: string | null;
  messageId: string | null;
  transactionRef?: string | null;
  amount?: string | null;
  completedAt: number | null;
  returnUrl: string;
};

export default function SuccessStep({
  accountNumber,
  bookingRef,
  messageId,
  transactionRef,
  amount,
  completedAt,
  returnUrl,
}: SuccessStepProps) {
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    ...(bookingRef
      ? [{ label: "Reference", value: bookingRef, mono: true }]
      : []),
    ...(transactionRef
      ? [{ label: "Transaction", value: transactionRef, mono: true }]
      : []),
    ...(messageId
      ? [{ label: "Transaction ID", value: messageId, mono: true }]
      : []),
    { label: "Debit account", value: maskAccount(accountNumber), mono: true },
    ...(amount?.trim() ? [{ label: "Amount", value: amount.trim() }] : []),
    ...(completedAt
      ? [{ label: "Date", value: new Date(completedAt).toLocaleString() }]
      : []),
  ];

  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center">
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: PRIMARY_ACCENT_SOFT }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${PRIMARY_ACCENT}` }}
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <Check size={30} strokeWidth={3} style={{ color: PRIMARY_ACCENT }} />
        </motion.div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-[1.125rem] font-bold text-slate-800">
          Payment confirmed
        </h2>
        <p className="text-[0.875rem] text-slate-500">
          Your payment to {AIRLINE_NAME} has been completed.
        </p>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl bg-[#f8fafc] p-3.5 text-left">
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
                  className={`break-all text-right text-[0.8125rem] font-semibold text-slate-700 ${
                    row.mono ? "font-mono tabular-nums" : ""
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="space-y-1.5">
        <Button
          component="a"
          href={returnUrl}
          rel="noopener noreferrer"
          fullWidth
          variant="contained"
          sx={primaryButtonSx}
        >
          <ExternalLink size={16} />
          Return to {AIRLINE_NAME}
        </Button>

        <Button
          type="button"
          onClick={() => window.print()}
          sx={{ ...textButtonSx, color: "#64748b" }}
          startIcon={<Printer size={15} />}
        >
          Print receipt
        </Button>
      </div>
    </div>
  );
}
