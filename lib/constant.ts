import { AnyLayer, CARD_W, ImageLayer, TextLayer } from "./types";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// PAN and expiry (fixed content)
export const PAN_TEXT = "4567 1234 5678 9012";
export const EXPIRY_TEXT = "12/29";

export const DEFAULT_TEXT: Omit<TextLayer, "id" | "name" | "type"> = {
  text: "Your Text",
  color: "#111111",
  fontFamily:
    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontWeight: 600,
  align: "left",
  x: 40,
  y: 40,
  w: 180,
  h: 48,
  z: 0,
};

export const DEFAULT_IMAGE: Omit<ImageLayer, "id" | "name" | "type" | "src"> = {
  lockAspectRatio: true,
  x: 220,
  y: 40,
  w: 120,
  h: 80,
  z: 0,
};

export const ISSUER_LAYER_ID = "issuer-logo";

export const FIXED_LAYERS: AnyLayer[] = [
  {
    id: "chip",
    name: "Chip",
    type: "fixed-chip",
    locked: true,
    x: 36,
    y: 78,
    w: 52,
    h: 40,
    z: 0,
  },
  {
    id: "pan",
    name: "Card Number",
    type: "fixed-pan",
    locked: true,
    x: 36,
    y: 168,
    z: 0,
    h: 0,
    w: 0,
  },
  {
    id: "exp",
    name: "Expiry",
    type: "fixed-expiry",
    locked: true,
    x: 36,
    y: 200,
    z: 0,
    h: 0,
    w: 0,
  },
];

export const SYSTEM_FONTS = [
  {
    label: "System",
    value:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },
  { label: "Serif", value: 'Georgia, "Times New Roman", Times, serif' },
  {
    label: "Monospace",
    value:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  {
    label: "Rounded",
    value: '"Trebuchet MS", "Gill Sans", "Avenir Next", Arial, sans-serif',
  },
];
