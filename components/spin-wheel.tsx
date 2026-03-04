"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Prize {
  id: number;
  name: string;
  color: string;
}

const PRIZES: Prize[] = [
  { id: 1, name: "Free Custom Card", color: "#FFD700" },
  { id: 2, name: "Card Top up", color: "#FF6B6B" },
  { id: 3, name: "1% Cashback on first 50 Transactions", color: "#4ECDC4" },
  { id: 4, name: "20% Off Next Card", color: "#96CEB4" },
  { id: 5, name: "Priority Support", color: "#DDA15E" },
  { id: 6, name: "Try Again Tomorrow", color: "#BC6C25" },
];

const SEGMENT_ANGLE = 360 / PRIZES.length; // 45 degrees per segment

interface SpinWheelProps {
  onSpinStart?: () => void;
  onSpinComplete?: (result: {
    prize: string;
    prizeId: number;
    claimCode: string;
    color: string;
  }) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SpinWheel({
  onSpinStart,
  onSpinComplete,
  isLoading = false,
  disabled = false,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelSize] = useState(300);

  const handleSpin = async () => {
    if (isSpinning || disabled || isLoading) return;

    setIsSpinning(true);
    onSpinStart?.();

    try {
      // Make API call to get the prize
      // Mock API response for demo/testing
      await new Promise((resolve) => setTimeout(resolve, 500)); // simulate network delay

      // Randomly select a prize
      const randomIndex = Math.floor(Math.random() * PRIZES.length);
      const selectedPrize = PRIZES[randomIndex];

      const data = {
        success: true,
        prize: selectedPrize.name,
        prizeId: selectedPrize.id,
        claimCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        color: selectedPrize.color,
      };

      if (!data.success) {
        setIsSpinning(false);
        return;
      }

      // Calculate rotation to land on the selected prize
      const prizeIndex = data.prizeId - 1;
      const targetAngle = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

      // Add multiple full rotations for visual effect (5-8 full spins)
      const fullSpins = 5 + Math.random() * 3;
      const finalRotation = fullSpins * 360 + (360 - targetAngle);

      // Animate the wheel
      setRotation(finalRotation);

      // Wait for animation to complete, then call the callback
      await new Promise((resolve) => setTimeout(resolve, 2500));

      onSpinComplete?.({
        prize: data.prize,
        prizeId: data.prizeId,
        claimCode: data.claimCode,
        color: data.color,
      });

      setIsSpinning(false);
    } catch (error) {
      console.error("Spin error:", error);
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="relative"
        ref={wheelRef}
        style={{ width: wheelSize, height: wheelSize }}
      >
        {/* Wheel SVG */}
        <svg
          width={wheelSize}
          height={wheelSize}
          viewBox={`0 0 ${wheelSize} ${wheelSize}`}
          className="absolute inset-0"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 2.5s cubic-bezier(0.17, 0.67, 0.12, 0.98)"
              : "none",
          }}
        >
          {PRIZES.map((prize, index) => {
            const angle = (index * SEGMENT_ANGLE * Math.PI) / 180;
            const nextAngle = ((index + 1) * SEGMENT_ANGLE * Math.PI) / 180;
            const radius = wheelSize / 2;
            const innerRadius = 30;

            // Calculate points for the segment
            const x1 = radius + radius * Math.cos(angle - Math.PI / 2);
            const y1 = radius + radius * Math.sin(angle - Math.PI / 2);
            const x2 = radius + radius * Math.cos(nextAngle - Math.PI / 2);
            const y2 = radius + radius * Math.sin(nextAngle - Math.PI / 2);

            const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

            // Path for the segment
            const pathData = [
              `M ${radius} ${radius}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            // Text position
            const textAngle = angle + (nextAngle - angle) / 2;
            const textRadius = radius * 0.65;
            const textX =
              radius + textRadius * Math.cos(textAngle - Math.PI / 2);
            const textY =
              radius + textRadius * Math.sin(textAngle - Math.PI / 2);

            return (
              <g key={prize.id}>
                {/* Segment */}
                <path
                  d={pathData}
                  fill={prize.color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Text */}
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                  className="pointer-events-none"
                  style={{
                    transform: `rotate(${((textAngle * 180) / Math.PI + 90) % 360}deg)`,
                    transformOrigin: `${textX}px ${textY}px`,
                  }}
                >
                  {prize.name}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle
            cx={wheelSize / 2}
            cy={wheelSize / 2}
            r="25"
            fill="white"
            stroke="#333"
            strokeWidth="2"
          />
        </svg>

        {/* Pointer at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
        </div>
      </div>

      {/* Spin Button */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning || disabled || isLoading}
        size="lg"
        className="px-8 py-6 text-lg font-bold"
      >
        {isSpinning || isLoading ? "Spinning..." : "SPIN NOW!"}
      </Button>

      <style jsx>{`
        .border-l-6 {
          border-left-width: 6px;
        }
        .border-r-6 {
          border-right-width: 6px;
        }
        .border-t-8 {
          border-top-width: 8px;
        }
      `}</style>
    </div>
  );
}
