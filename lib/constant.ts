import { AnyLayer, ImageLayer, TextLayer } from "./types";
import { v4 as uuidv4 } from "uuid";

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
export const imageUrl = baseUrl?.replace("/api/v1", "");


export function uid(prefix = "id") {
  return uuidv4();
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

export const ISSUER_LAYER_ID = uid();

export const FIXED_LAYERS: AnyLayer[] = [
  {
    id: uid(),
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
    id: uid(),
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
    id: uid(),
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

export function base64ToFile(base64Data: string, filename: string) {
  const matches = base64Data.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!matches) {
    // 
    return;
  }
  // const arr = base64Data.split(",");
  // 
  const mimeType = matches[1]; // e.g., image/png
  const rawData = matches[2]; // Raw Base64 string
  const extension = mimeType.split("/")[1]; // e.g., png, jpeg
  // const mimeMatch = arr[0].match(/:(.*?);/);
  // 
  // if (!mimeMatch) throw new Error("Invalid base64 string");

  // const mime = mimeMatch[1]; // e.g., "image/png"
  // const ext = mime.split("/")[1]; // "png" or "jpeg"

  const bstr = atob(rawData);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], `${filename}.${extension}`, { type: mimeType });
}
