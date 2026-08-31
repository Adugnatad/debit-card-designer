"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock, Plane } from "lucide-react";
import {
  AIRLINE_CRIMSON,
  AIRLINE_LOGO_H,
  AIRLINE_LOGO_SRC,
  AIRLINE_LOGO_W,
  AIRLINE_NAME,
} from "@/lib/ethioairlines/brandAssets";

const MARK_HEIGHT = 22;
const MARK_WIDTH = Math.round((AIRLINE_LOGO_W / AIRLINE_LOGO_H) * MARK_HEIGHT);
/** Same optical correction as the header -- see CheckoutHeader for the measurement. */
const MARK_OPTICAL_NUDGE_PX = Math.round(MARK_HEIGHT * 0.134 * 10) / 10;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Advisory countdown only. The key's embedded timestamp is displayed for user
 * trust but never gates submission -- the gateway stays authoritative.
 */
function useCountdown(expiresAtMs: number | null): string | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (expiresAtMs == null) return;
    // Set inside the effect so server and first client render agree.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAtMs]);

  if (expiresAtMs == null || now == null) return null;
  const remaining = expiresAtMs - now;
  return remaining <= 0 ? "expired" : formatRemaining(remaining);
}

type Row = { label: string; value: string; mono?: boolean };

export type OrderSummaryCardProps = {
  bookingRef: string | null;
  expiresAtMs: number | null;
  amount?: string | null;
};

export default function OrderSummaryCard({
  bookingRef,
  expiresAtMs,
  amount,
}: OrderSummaryCardProps) {
  // Expanded by default: on mobile this is the only place the amount and
  // reference appear, so collapsing it hides the details the payer needs.
  const [open, setOpen] = useState(true);
  const [markFailed, setMarkFailed] = useState(false);
  const countdown = useCountdown(expiresAtMs);

  const rows: Row[] = [
    { label: "Paying", value: AIRLINE_NAME },
    ...(bookingRef
      ? [{ label: "Reference", value: bookingRef, mono: true }]
      : []),
    {
      label: "Amount",
      value: amount?.trim() || `Shown by ${AIRLINE_NAME}`,
    },
  ];

  const strip = [
    AIRLINE_NAME,
    bookingRef ? `ref ${bookingRef}` : null,
    countdown && countdown !== "expired" ? `expires ${countdown}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-3"
        >
          <span className="shrink-0 text-[0.75rem] uppercase tracking-wide text-slate-400">
            {row.label}
          </span>
          <span
            className={`text-right text-[0.8125rem] font-semibold text-slate-700 ${
              row.mono ? "font-mono tabular-nums" : ""
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}

      {countdown && (
        <div className="flex items-center gap-1.5 border-t border-[#e0f2fe] pt-2.5 text-[0.75rem]">
          <Clock size={13} className="shrink-0 text-slate-400" />
          {countdown === "expired" ? (
            <span className="font-semibold text-amber-600">
              This link may have expired
            </span>
          ) : (
            <span className="text-slate-500">
              Session expires in{" "}
              <span className="font-semibold tabular-nums text-slate-700">
                {countdown}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: collapsible one-line strip above the panel. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#e0f2fe] bg-white px-3.5 py-2.5 text-left"
        >
          <span className="truncate text-[0.8125rem] font-medium text-slate-600">
            {strip}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        {open && (
          <div className="mt-2 rounded-xl border border-[#e0f2fe] bg-white p-3.5">
            {body}
          </div>
        )}
      </div>

      {/* Desktop: sticky right rail. */}
      <aside className="hidden lg:sticky lg:top-6 lg:block">
        <div className="rounded-2xl border border-[#e0f2fe] bg-white p-4">
          <div className="mb-3.5 flex items-center gap-2 border-b border-[#e0f2fe] pb-3">
            {markFailed ? (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold text-white"
                style={{ backgroundColor: AIRLINE_CRIMSON }}
              >
                ET
              </span>
            ) : (
              <Image
                src={AIRLINE_LOGO_SRC}
                alt=""
                width={MARK_WIDTH}
                height={MARK_HEIGHT}
                onError={() => setMarkFailed(true)}
                style={{
                  height: MARK_HEIGHT,
                  width: "auto",
                  transform: `translateY(-${MARK_OPTICAL_NUDGE_PX}px)`,
                }}
              />
            )}
            <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-slate-700">
              <Plane size={13} className="rotate-45 text-slate-400" />
              Order summary
            </span>
          </div>
          {body}
        </div>
      </aside>
    </>
  );
}
