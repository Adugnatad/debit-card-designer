"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { COOP_CYAN, COOP_CYAN_TEXT } from "@/lib/ethioairlines/brandAssets";

/**
 * Compact stepper for the checkout.
 *
 * Deliberately NOT `components/CorporateForm/Stepper.tsx` -- that one is shared
 * with /fifaworldcup, so restyling it there would change that flow too.
 *
 * Labels sit absolutely below the markers so the connectors can align to the
 * marker centres without the (much wider) labels distorting the spacing.
 */

const ACTIVE = COOP_CYAN;
const TRACK_DONE = "rgba(0, 173, 239, 0.8)";
const TRACK_TODO = "#e2e8f0";

export type CheckoutStepperProps = {
  steps: string[];
  activeStep: number;
};

export default function CheckoutStepper({
  steps,
  activeStep,
}: CheckoutStepperProps) {
  return (
    <ol
      className="flex w-full items-center pb-5 pt-1 sm:pb-6 sm:pt-1.5"
      aria-label="Checkout progress"
    >
      {steps.map((label, i) => {
        const done = i < activeStep;
        const active = i === activeStep;

        return (
          <Fragment key={label}>
            {i > 0 && (
              <span
                aria-hidden
                className="mx-1.5 h-px flex-1 rounded-full transition-colors duration-300 sm:mx-2"
                style={{ backgroundColor: done ? TRACK_DONE : TRACK_TODO }}
              />
            )}

            <li
              className="relative flex shrink-0 flex-col items-center"
              aria-current={active ? "step" : undefined}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold tabular-nums transition-all duration-300 sm:h-6 sm:w-6 sm:text-[0.6875rem]"
                style={{
                  backgroundColor: done || active ? ACTIVE : "#ffffff",
                  color: done || active ? "#ffffff" : "#94a3b8",
                  border:
                    done || active ? "none" : `1.5px solid ${TRACK_TODO}`,
                }}
              >
                {done ? (
                  <Check
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                    strokeWidth={3.25}
                  />
                ) : (
                  i + 1
                )}
              </span>

              <span
                className="absolute left-1/2 top-[calc(100%+0.4375rem)] -translate-x-1/2 whitespace-nowrap text-[0.6875rem] leading-none transition-colors duration-300 sm:top-[calc(100%+0.5rem)] sm:text-[0.75rem]"
                style={{
                  color: active
                    ? COOP_CYAN_TEXT
                    : done
                      ? "#475569"
                      : "#64748b",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
