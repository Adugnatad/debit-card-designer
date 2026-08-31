"use client";

import { useState } from "react";
import Image from "next/image";
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
          <span
            aria-hidden
            className="block h-5 w-px shrink-0"
            style={{
              background: `linear-gradient(180deg, ${AIRLINE_GREEN}, ${AIRLINE_GOLD}, ${AIRLINE_CRIMSON})`,
              opacity: 0.85,
            }}
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
              // Rendered TALLER than the Coop mark on purpose. Coop's wordmark
              // fills 67% of its box; this one only 21%, because the swoosh
              // takes a sparse top band and the Amharic lockup sits below. At
              // equal box heights the airline wordmark reads as much smaller.
              //
              // Lifted so the two WORDMARKS sit on one line. `items-center`
              // aligns the boxes, but the words sit at different depths inside
              // them: "coop" is centred 34.2% down its box, "Ethiopian" 61.2%
              // down its own. Lift = (0.612-0.5)*H_airline + (0.5-0.342)*H_coop
              // -> 9.2px at 38/31, 7.8px at 33/26.
              className="h-[38px] w-auto -translate-y-[9px] sm:h-[33px] sm:-translate-y-[8px]"
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
