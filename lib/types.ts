export const CARD_W = 420;
export const CARD_H = 265;

export type BaseLayer = {
  id: string;
  name: string;
  type:
    | "text"
    | "image"
    | "fixed-chip"
    | "fixed-pan"
    | "fixed-expiry"
    | "fixed_chip"
    | "fixed_pan"
    | "fixed_expiry";
  locked?: boolean;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  z?: number;
};

export type TextLayer = BaseLayer & {
  type: "text";
  text: string;
  color: string;
  fontFamily: string;
  fontWeight: number;
  align: "left" | "center" | "right";
};

export type ImageLayer = BaseLayer & {
  type: "image";
  src: string;
  lockAspectRatio: boolean;
};

export type FixedChipLayer = BaseLayer & { type: "fixed-chip" };
export type FixedPanLayer = BaseLayer & { type: "fixed-pan" };
export type FixedExpiryLayer = BaseLayer & { type: "fixed-expiry" };

export type AnyLayer =
  | TextLayer
  | ImageLayer
  | FixedChipLayer
  | FixedPanLayer
  | FixedExpiryLayer;

export const STORAGE_KEY = "virtual-card-designer.v1";
export type GradientStop = { id: string; color: string; pos: number };
export type GradientState = {
  kind: "linear" | "radial";
  angle: number;
  stops: GradientStop[];
};
export type BgMode = "color" | "gradient" | "image";
export type DesignSnapshot = {
  id?: string;
  v: 1;
  bgMode: BgMode;
  bgColor: string;
  gradient: GradientState;
  bgImage: string | null;
  bg: { x: number; y: number; w: number; h: number; lockAspect: boolean };
  layers: AnyLayer[];
};

export type GalleryType = {
  data: DesignSnapshot[];
  meta: {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};
