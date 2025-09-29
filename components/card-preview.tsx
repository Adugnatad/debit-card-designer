"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DesignSnapshot, ImageLayer, TextLayer } from "@/lib/types";

interface CardPreviewProps {
  design?: DesignSnapshot | null;
}

const CARD_W = 420;
const CARD_H = 265;
const STORAGE_KEY = "virtual-card-designer.v1";

function fontSizeFromHeight(h: number) {
  return Math.max(10, Math.round(h * 0.6));
}

export default function CardPreview({ design }: CardPreviewProps) {
  const [snapshot, setSnapshot] = useState<DesignSnapshot | null>(null);

  console.log("design snapshot in preview", snapshot);

  useEffect(() => {
    if (design) {
      setSnapshot(design);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DesignSnapshot;
        console.log("parsed", parsed);
        setSnapshot(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const gradientCss = useMemo(() => {
    if (!snapshot) return "";
    const { gradient } = snapshot;
    const stops = [...gradient.stops]
      .sort((a, b) => a.pos - b.pos)
      .map((s) => `${s.color} ${s.pos}%`)
      .join(", ");
    if (gradient.kind === "linear")
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
    return `radial-gradient(circle at center, ${stops})`;
  }, [snapshot]);

  function embossedTextStyle(
    elementX: number,
    elementY: number
  ): React.CSSProperties {
    if (!snapshot) return {};
    const embossedShadow =
      "-1px -1px 0 rgba(255,255,255,0.75), 1px 1px 0 rgba(0,0,0,0.35)";
    const { bgMode, bgImage, bg, bgColor } = snapshot;
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

  const cardStyle: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 16,
      boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
      overflow: "hidden",
      position: "relative",
      backgroundColor: snapshot?.bgColor ?? "#E8E5E2",
    };
    if (!snapshot) return base;
    if (snapshot.bgMode === "gradient")
      return { ...base, backgroundImage: gradientCss };
    return base;
  }, [snapshot, gradientCss]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Card Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Prevent the preview column from squeezing below the card width */}
        <div
          className="flex items-center justify-center"
          style={{ minWidth: CARD_W }}
        >
          <div
            className="relative select-none"
            style={cardStyle}
            aria-label="Read-only card preview"
          >
            {/* Background image if used */}
            {snapshot?.bgMode === "image" && snapshot.bgImage && (
              <div
                style={{
                  position: "absolute",
                  left: snapshot.bg.x,
                  top: snapshot.bg.y,
                  width: snapshot.bg.w,
                  height: snapshot.bg.h,
                  zIndex: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    `http://localhost:5000${snapshot.bgImage}` ||
                    "/placeholder.svg"
                  }
                  alt="Background"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Sheen and noise overlays */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: 1000,
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 30%, rgba(0,0,0,0.10) 70%, rgba(0,0,0,0.25) 100%)",
                mixBlendMode: "soft-light",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                zIndex: 1001,
                backgroundImage: "url(/images/noise.png)",
                backgroundRepeat: "repeat",
                backgroundSize: "128px 128px",
                mixBlendMode: "overlay",
              }}
            />

            {/* Layers */}
            {snapshot?.layers?.map((layer, index) => {
              const zIndex = index + 2;
              if (layer.type && layer.type.replace("_", "-") === "fixed-chip") {
                return (
                  <div
                    key={layer.id}
                    className="absolute"
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
              if (
                layer.type &&
                layer.type.replace("_", "-") === "fixed-expiry"
              ) {
                const x = layer.x ?? 0;
                const y = layer.y ?? 0;
                return (
                  <div
                    key={layer.id}
                    className="absolute"
                    style={{ left: x, top: y, zIndex }}
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
                      />
                    ) : (
                      <img
                        src={
                          il.src.startsWith("data")
                            ? il.src
                            : `http://localhost:5000${il.src}`
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

            {!snapshot && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                No saved design found. Create one on the design page.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
