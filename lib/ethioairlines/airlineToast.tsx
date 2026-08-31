"use client";

import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { PRIMARY_ACCENT } from "./brandAssets";

function cardStyle(accent: string): CSSProperties {
  return {
    background: "#ffffff",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#666666",
    boxShadow: "0 4px 24px rgba(15, 23, 42, 0.14)",
    borderLeft: `5px solid ${accent}`,
    maxWidth: "min(420px, 92vw)",
    lineHeight: 1.45,
  };
}

const ERROR_ACCENT = "#ef4444";
const SUCCESS_ACCENT = PRIMARY_ACCENT;

/** Deliberately opaque catch-all, matching the fifaworldcup convention. */
export function airlineToastSomethingWrong() {
  toast.custom(
    () => (
      <div style={cardStyle(ERROR_ACCENT)} role="status">
        Something went wrong
      </div>
    ),
    { duration: 4500 }
  );
}

export function airlineToastError(message: string) {
  toast.custom(
    () => (
      <div style={cardStyle(ERROR_ACCENT)} role="status">
        {message}
      </div>
    ),
    { duration: 4500 }
  );
}

export function airlineToastSuccess(message: string) {
  toast.custom(
    () => (
      <div style={cardStyle(SUCCESS_ACCENT)} role="status">
        {message}
      </div>
    ),
    { duration: 3200 }
  );
}
