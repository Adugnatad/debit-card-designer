"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plane, ShieldCheck } from "lucide-react";
import {
  AIRLINE_CRIMSON,
  AIRLINE_GOLD,
  AIRLINE_GREEN,
  AIRLINE_LOGO_H,
  AIRLINE_LOGO_SRC,
  AIRLINE_LOGO_W,
  AIRLINE_NAME,
  COOP_CYAN_DARK,
  COOP_CYAN_TEXT,
  COOP_LOGO_SRC,
} from "@/lib/ethioairlines/brandAssets";

const LOGO_HEIGHT = 26;
const LOGO_WIDTH = Math.round((AIRLINE_LOGO_W / AIRLINE_LOGO_H) * LOGO_HEIGHT);

/** Text lockup shown if either image fails to load -- covers a bad deploy. */
function AirlineTextMark() {
  return (
    <span className="flex items-center gap-1.5">
      <Plane size={18} className="rotate-45" style={{ color: AIRLINE_CRIMSON }} />
      <span
        className="text-[0.9375rem] font-bold tracking-tight"
        style={{ color: AIRLINE_CRIMSON }}
      >
        {AIRLINE_NAME}
      </span>
    </span>
  );
}

export default function CheckoutHeader() {
  const [airlineLogoFailed, setAirlineLogoFailed] = useState(false);
  const [coopLogoFailed, setCoopLogoFailed] = useState(false);

  // Not sticky: the header sits with the stepper and card as one centered
  // block, so pinning it to the viewport top would split them apart.
  return (
    <header className="px-4 pt-4 sm:pt-0">
      {/* Flat white surface constrained to the content column -- no border,
          radius or shadow. */}
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center justify-between gap-3 bg-white px-4 md:h-14">
        <div className="flex w-full min-w-0 items-center justify-between sm:w-auto sm:justify-start sm:gap-4">
          {coopLogoFailed ? (
            <span className="text-[0.8125rem] font-bold tracking-tight text-[#00adef]">
              Coop Bank
            </span>
          ) : (
            <Image
              src={COOP_LOGO_SRC}
              alt="Cooperative Bank of Oromia"
              width={80}
              height={LOGO_HEIGHT}
              priority
              onError={() => setCoopLogoFailed(true)}
              className="h-[31px] w-auto sm:h-[26px]"
            />
          )}

          {/* Swoosh-coloured divider: the airline's green/gold as a thin rule.
              As the middle child of a justify-between row it lands dead centre
              on mobile; from sm up it sits between the grouped logos. */}
          <motion.span
            aria-hidden
            className="block h-5 w-px shrink-0"
            style={{
              background: `linear-gradient(180deg, ${AIRLINE_GREEN}, ${AIRLINE_GOLD}, ${AIRLINE_CRIMSON})`,
            }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 0.85, scaleY: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {airlineLogoFailed ? (
            <AirlineTextMark />
          ) : (
            <Image
              src={AIRLINE_LOGO_SRC}
              alt={AIRLINE_NAME}
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              priority
              onError={() => setAirlineLogoFailed(true)}
              // Both PNGs are tightly cropped, so `items-center` aligns their
              // boxes but not their artwork. Measured ink centroids: this mark's
              // sits 7.2% BELOW its box centre (the swoosh fills a sparse top
              // band), Coop's sits 6.2% ABOVE it. Nudge up by that ~13.4% gap so
              // the wordmarks align optically -- scaled per breakpoint.
              className="h-[31px] w-auto -translate-y-[4.2px] sm:h-[26px] sm:-translate-y-[3.5px]"
            />
          )}
        </div>

        {/* Brand-cyan trust chip: flat tint only -- no border, no shadow. */}
        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-[0.3125rem] text-[0.6875rem] font-semibold tracking-[0.01em] sm:inline-flex"
          style={{
            color: COOP_CYAN_TEXT,
            backgroundColor: "rgba(0, 173, 239, 0.09)",
          }}
        >
          <ShieldCheck size={13} strokeWidth={2.25} style={{ color: COOP_CYAN_DARK }} />
          Secure payment
        </span>
      </div>
    </header>
  );
}
