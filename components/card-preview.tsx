"use client";

import type React from "react";

import {
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import type { DesignSnapshot, TextLayer, ImageLayer } from "@/lib/types";
import { imageUrl } from "@/lib/constant";

interface CardPreviewProps {
  design: DesignSnapshot;
  className?: string;
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string) => void
}

export type CardPreviewHandle = {
  exportAsPng: () => Promise<void>;
  exporting: boolean;
};

const CARD_W = 420;
const CARD_H = 265;

function fontSizeFromHeight(h: number) {
  return Math.max(10, Math.round(h * 0.6));
}

export const CardPreview = forwardRef<CardPreviewHandle, CardPreviewProps>(
  ({ design, onDelete, onEdit, className = "" }, ref) => {


    const [isHovered, setIsHovered] = useState(false)

    const cardRef = useRef<HTMLDivElement>(null);

    const gradientCss = useMemo(() => {
      if (!design) return "";
      const { gradient } = design;
      const stops = [...gradient.stops]
        .sort((a, b) => a.pos - b.pos)
        .map((s) => `${s.color} ${s.pos}%`)
        .join(", ");
      if (gradient.kind === "linear")
        return `linear-gradient(${gradient.angle}deg, ${stops})`;
      return `radial-gradient(circle at center, ${stops})`;
    }, [design]);
    
    const cardStyle: React.CSSProperties = useMemo(() => {
      const base: React.CSSProperties = {
        width: CARD_W,
        height: CARD_H,
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
        overflow: "hidden",
        position: "relative",
        backgroundColor: design?.bgColor ?? "#E8E5E2",
      };
      if (!design) return base;
      if (design.bgMode === "gradient")
        return { ...base, backgroundImage: gradientCss };
      return base;
    }, [design, gradientCss]);

    function embossedTextStyle(
      elementX: number,
      elementY: number
    ): React.CSSProperties {
      if (!design) return {};
      const embossedShadow =
        "-1px -1px 0 rgba(255,255,255,0.75), 1px 1px 0 rgba(0,0,0,0.35)";
      const { bgMode, bgImage, bg, bgColor } = design;
      if (bgMode === "image" && bgImage) {
        return {
          color: "transparent",
          WebkitTextFillColor: "transparent",
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${bg.w}px ${bg.h}px`,
          backgroundPosition: `${bg.x - elementX}px ${bg.y - elementY}px`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          textShadow: embossedShadow,
        };
      }
      if (bgMode === "gradient") {
        return {
          color: "transparent",
          WebkitTextFillColor: "transparent",
          backgroundImage: gradientCss,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          textShadow: embossedShadow,
        };
      }
      return { color: bgColor, textShadow: embossedShadow };
    }


    const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onEdit || !design.id) return
    if (onEdit) {
      onEdit(design.id)
    }
  }


    return (
      <div
        className="flex items-center justify-center group relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
        style={{ minWidth: CARD_W }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={cardRef}
          className="relative select-none"
          style={{ ...cardStyle, borderRadius: 16 }}
          aria-label="Read-only card preview"
        >
          {/* Background image if used */}
          {design?.bgMode === "image" && design.bgImage && (
            <div
              style={{
                position: "absolute",
                left: design.bg.x,
                top: design.bg.y,
                width: design.bg.w,
                height: design.bg.h,
                zIndex: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${imageUrl}${design.bgImage}` || "/placeholder.svg"}
                alt="Background"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Sheen and noise overlays */}
          {design?.layers?.map((layer, index) => {
            const zIndex = index + 2;
            if (layer.type && layer.type.replace("_", "-") === "fixed-chip") {
              return (
                <div
                  key={layer.id}
                  className="absolute"
                  data-layer-id="chip"
                  style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.w,
                    height: layer.h,
                    zIndex,
                  }}
                  aria-label="Card chip"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/chip.png"
                    alt="EMV chip"
                    className="h-full w-full object-contain opacity-90"
                    draggable={false}
                  />
                </div>
              );
            }
            if (layer.type && layer.type.replace("_", "-") === "fixed-pan") {
              const x = layer.x ?? 0;
              const y = layer.y ?? 0;
              return (
                <div
                  key={layer.id}
                  className="absolute"
                  style={{ left: x, top: y, zIndex }}
                  data-layer-id="chip"
                >
                  <div
                    className="font-semibold tracking-widest"
                    style={{
                      fontSize: 20,
                      letterSpacing: "0.12em",
                      ...embossedTextStyle(x, y),
                    }}
                  >
                    {"4567 1234 5678 9012"}
                  </div>
                </div>
              );
            }
            if (layer.type && layer.type.replace("_", "-") === "fixed-expiry") {
              const x = layer.x ?? 0;
              const y = layer.y ?? 0;
              return (
                <div
                  key={layer.id}
                  className="absolute"
                  style={{ left: x, top: y, zIndex }}
                  data-layer-id="chip"
                >
                  <div
                    className="text-[10px] mb-1"
                    style={{ opacity: 0.7, ...embossedTextStyle(x, y - 14) }}
                  >
                    {"VALID THRU"}
                  </div>
                  <div
                    className="font-semibold tracking-wide"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.08em",
                      ...embossedTextStyle(x, y),
                    }}
                  >
                    {"12/29"}
                  </div>
                </div>
              );
            }
            if (layer.type === "text") {
              const tl = layer as TextLayer;
              const x = tl.x ?? 0;
              const y = tl.y ?? 0;
              const w = tl.w ?? 180;
              const h = tl.h ?? 48;
              const justifyContent =
                tl.align === "center"
                  ? "center"
                  : tl.align === "right"
                  ? "flex-end"
                  : "flex-start";
              return (
                <div
                  key={tl.id}
                  className="absolute"
                  style={{ left: x, top: y, width: w, height: h, zIndex }}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent,
                      fontFamily: tl.fontFamily,
                      fontWeight: tl.fontWeight,
                      fontSize: fontSizeFromHeight(h),
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      userSelect: "none",
                      ...embossedTextStyle(x, y),
                    }}
                  >
                    {tl.text}
                  </div>
                </div>
              );
            }
            if (layer.type === "image") {
              const il = layer as ImageLayer;
              const x = il.x ?? 0;
              const y = il.y ?? 0;
              const w = il.w ?? 120;
              const h = il.h ?? 80;
              return (
                <div
                  key={il.id}
                  className="absolute"
                  style={{ left: x, top: y, width: w, height: h, zIndex }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {layer.name === "Issuer Logo" ? (
                    <img
                      src={`${il.src}` || "/images/coop-logo.png"}
                      alt={layer.name}
                      className="h-full w-full object-contain pointer-events-none select-none"
                      draggable={false}
                      data-layer-id="chip"
                    />
                  ) : (
                    <img
                      src={
                        il.src.startsWith("data")
                          ? il.src
                          : `${imageUrl}${il.src}`
                      }
                      alt={layer.name}
                      className="h-full w-full object-contain pointer-events-none select-none"
                      draggable={false}
                    />
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
        {
          onEdit &&
        <button
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm space-between p-2 flex gap-3 transition-all duration-200 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={handleEdit}
          >
        
      </button>
      }
      </div>
    );
  }
);
