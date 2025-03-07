"use client";

import { useState, useRef, useEffect } from "react";
import { motion, type PanInfo } from "framer-motion";
import type { CardDesign } from "@/components/card-designer";
import { CreditCard } from "lucide-react";

interface CardPreviewProps {
  design: CardDesign;
  onTextPositionChange?: (position: { x: number; y: number }) => void;
  isDraggable?: boolean;
}

export function CardPreview({
  design,
  onTextPositionChange,
  isDraggable = true,
}: CardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    x: design.textPosition.x,
    y: design.textPosition.y,
  });
  const [constraints, setConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  // Update position when design changes
  useEffect(() => {
    setPosition({ x: design.textPosition.x, y: design.textPosition.y });
  }, [design.textPosition.x, design.textPosition.y]);

  // Set constraints based on card dimensions
  useEffect(() => {
    if (cardRef.current) {
      const { width, height } = cardRef.current.getBoundingClientRect();
      setConstraints({
        top: 10,
        left: 10,
        right: width - 10,
        bottom: height - 40, // Increased bottom margin to allow more space
      });
    }
  }, []);

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Update local position state during drag
    const newPosition = {
      x: position.x + info.delta.x,
      y: position.y + info.delta.y,
    };

    // Apply constraints manually
    const constrainedX = Math.max(
      constraints.left,
      Math.min(constraints.right, newPosition.x)
    );
    const constrainedY = Math.max(
      constraints.top,
      Math.min(constraints.bottom, newPosition.y)
    );

    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (onTextPositionChange) {
      // Pass the final position to the parent component
      onTextPositionChange(position);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-lg"
      style={{
        backgroundColor: design.backgroundColor,
        backgroundImage: design.backgroundImage
          ? `url(${design.backgroundImage})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Bank logo placeholder */}
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-md">
        <CreditCard className="w-6 h-6 text-white" />
      </div>

      {/* Chip and contactless symbols */}
      <div className="absolute top-16 left-6">
        <div className="w-10 h-8 bg-yellow-300/90 rounded-md"></div>
      </div>
      {/* <div className="absolute top-16 left-20">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
            fill="white"
            fillOpacity="0.8"
          />
          <path
            d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5v-2C9.46 6.5 6.5 9.46 6.5 13h2c0-1.93 1.57-3.5 3.5-3.5v-2c-3.54 0-6.5 2.96-6.5 6.5h2z"
            fill="white"
            fillOpacity="0.8"
          />
        </svg>
      </div> */}

      {/* Card number placeholder */}
      <div className="absolute bottom-20 left-6 right-6">
        <div className="flex justify-between">
          <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
          <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
          <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
          <div className="w-10 h-3 bg-white/50 rounded-sm"></div>
        </div>
      </div>

      {/* Expiry date placeholder */}
      <div className="absolute bottom-8 left-6">
        <div
          className="text-xs"
          style={{
            color: `${design.cardDetailsTextColor}99`,
            fontFamily: `${design.fontFamily}`,
          }}
        >
          VALID THRU
        </div>
        <div
          className="text-sm"
          style={{
            color: design.cardDetailsTextColor,
            fontStyle: design.cardDetailsTextColor,
            fontFamily: design.fontFamily,
          }}
        >
          12/28
        </div>
      </div>

      {/* Custom text */}
      {isDraggable ? (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            x: position.x,
            y: position.y,
            color: design.textColor,
            fontFamily: design.fontFamily,
            cursor: "move",
            userSelect: "none",
            fontSize: "1.25rem",
            fontWeight: "bold",
            textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {design.customText}
        </motion.div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: design.textPosition.x,
            top: design.textPosition.y,
            color: design.textColor,
            fontFamily: design.fontFamily,
            fontSize: "1.25rem",
            fontWeight: "bold",
            textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {design.customText}
        </div>
      )}
    </div>
  );
}
