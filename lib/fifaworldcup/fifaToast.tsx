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

/** Styled like the FIFA flow error pill: white card, red left accent, gray copy. */
export function fifaToastSomethingWrong() {
  toast.custom(
    () => (
      <div style={cardStyle("#ef4444")} role="status">
        Something went wrong
      </div>
    ),
    { duration: 4500, position: "top-right" }
  );
}

/** Brand cyan (#00adef) at reduced opacity — matches FIFA UI, not green. */
const SUCCESS_ACCENT = "rgba(0, 173, 239, 0.45)";

export function fifaToastSuccess(message: string) {
  toast.custom(
    () => (
      <div style={cardStyle(SUCCESS_ACCENT)} role="status">
        {message}
      </div>
    ),
    { duration: 3200, position: "top-right" }
  );
}
