/**
 * Shared MUI `sx` for the checkout fields and buttons.
 *
 * The fifaworldcup page repeats ~60 lines of identical field/button styling per
 * step; defined once here instead.
 */

import type { SxProps, Theme } from "@mui/material";
import { PRIMARY_ACCENT, PRIMARY_ACCENT_DARK, PRIMARY_ACCENT_SOFT } from "./brandAssets";

/**
 * Numeric entry field. Font size is 1rem and NOT smaller -- iOS Safari zooms the
 * viewport on focus for anything under 16px.
 */
export const numericFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0.75rem",
    backgroundColor: "#ffffff",
    fontSize: "1rem",
    letterSpacing: "0.04em",
    fontVariantNumeric: "tabular-nums",
    "& fieldset": { borderColor: "#cfe8f7" },
    "&:hover fieldset": { borderColor: "#9ed4f0" },
    "&.Mui-focused fieldset": {
      borderColor: PRIMARY_ACCENT,
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY_ACCENT },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    fontSize: "0.8125rem",
  },
};

/** Full-width primary action. 2.75rem keeps the 44px minimum tap target. */
export const primaryButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: { xs: "0.9375rem", sm: "1rem" },
  height: { xs: "2.75rem", sm: "3rem" },
  borderRadius: "0.75rem",
  boxShadow: "none",
  backgroundColor: PRIMARY_ACCENT,
  color: "#ffffff",
  gap: 1,
  "&:hover": { backgroundColor: PRIMARY_ACCENT_DARK, boxShadow: "none" },
  // Disabled reads as a faded version of the brand fill rather than grey, so the
  // button keeps its identity while clearly inactive. WCAG 1.4.3 exempts
  // disabled controls from the contrast minimum, which this white-on-tint
  // combination would otherwise fail.
  "&.Mui-disabled": {
    backgroundColor: "rgba(0, 173, 239, 0.30)",
    color: "#ffffff",
  },
};

export const textButtonSx: SxProps<Theme> = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: PRIMARY_ACCENT,
  "&:hover": { backgroundColor: PRIMARY_ACCENT_SOFT },
  "&.Mui-disabled": { color: "#94a3b8" },
};

export const panelSx: SxProps<Theme> = {
  backgroundColor: "#ffffff",
  border: "1px solid #e0f2fe",
  borderRadius: "1rem",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};
