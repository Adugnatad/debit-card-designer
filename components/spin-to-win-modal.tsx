"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpinWheel } from "./spin-wheel";
import { useRouter } from "next/navigation";

interface SpinToWinModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SpinResult {
  prize: string;
  prizeId: number;
  claimCode: string;
  color: string;
}

export function SpinToWinModal({ isOpen, onOpenChange }: SpinToWinModalProps) {
  const [hasSpun, setHasSpun] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Check if user has already spun today (from localStorage for demo)
    const todayKey = `spin-${new Date().toISOString().split("T")[0]}`;
    const hasSpunToday = localStorage.getItem(todayKey);
    // setHasSpun(!!hasSpunToday);
  }, [isOpen]);

  const handleSpinComplete = (result: SpinResult) => {
    setSpinResult(result);
    setHasSpun(true);

    // Store spin in localStorage for demo
    const todayKey = `spin-${new Date().toISOString().split("T")[0]}`;
    localStorage.setItem(todayKey, JSON.stringify(result));
  };

  const handleClose = () => {
    // Reset state when closing
    if (!hasSpun) {
      setSpinResult(null);
      setIsSpinning(false);
      setError(null);
    }
    onOpenChange(false);
  };

  const handleSpinAgainTomorrow = () => {
    onOpenChange(false);
    setSpinResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            🎡 Spin to Win
          </DialogTitle>
          <DialogDescription>
            Try your luck and win amazing prizes!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {hasSpun && spinResult ? (
            // Show result
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="text-4xl">🎉</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
                <p className="text-lg mb-4">You won:</p>
                <div
                  className="px-6 py-4 rounded-lg text-white font-bold text-lg mb-4"
                  style={{ backgroundColor: spinResult.color }}
                >
                  {spinResult.prize}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Claim Code:{" "}
                  <span className="font-mono font-bold">
                    {spinResult.claimCode}
                  </span>
                </p>
              </div>

              {spinResult.prizeId === 1 && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    ✓ Free Custom Card!
                  </p>
                  <p className="text-xs text-blue-700">
                    Click "Claim Prize" to redeem your free custom card and
                    start designing today.
                  </p>
                </div>
              )}

              <div className="flex gap-3 w-full pt-4">
                <Button
                  onClick={handleSpinAgainTomorrow}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/cards/gallery`);
                    handleSpinAgainTomorrow();
                  }}
                  className="flex-1"
                >
                  Claim Prize
                </Button>
              </div>

              <p className="text-xs text-gray-500 pt-2">
                Come back tomorrow for another spin!
              </p>
            </div>
          ) : hasSpun ? (
            // Already spun today
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="text-4xl">⏰</div>
              <div>
                <h3 className="text-lg font-bold mb-2">Already spun today!</h3>
                <p className="text-gray-600 mb-6">
                  You've already claimed your daily spin. Come back tomorrow for
                  another chance to win!
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Got it
              </Button>
            </div>
          ) : (
            // Show spinner
            <SpinWheel
              onSpinStart={() => setIsSpinning(true)}
              onSpinComplete={handleSpinComplete}
              isLoading={isSpinning}
              disabled={hasSpun}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
