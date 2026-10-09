"use client";

import type { CSSProperties } from "react";
import toast from "react-hot-toast";

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
/** Coop brand cyan at reduced opacity. */
const SUCCESS_ACCENT = "rgba(0, 173, 239, 0.45)";

export function cardRequestToastError(message = "Something went wrong") {
  toast.custom(
    () => (
      <div style={cardStyle(ERROR_ACCENT)} role="status">
        {message}
      </div>
    ),
    { duration: 4500, position: "top-right" }
  );
}

export function cardRequestToastSuccess(message: string) {
  toast.custom(
    () => (
      <div style={cardStyle(SUCCESS_ACCENT)} role="status">
        {message}
      </div>
    ),
    { duration: 3200, position: "top-right" }
  );
}
