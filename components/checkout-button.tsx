"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DesignSnapshot, STORAGE_KEY } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "./loading-screen";
import { postDesignSnapshot } from "@/hooks/use-postDesignSnapshot";

export default function CheckoutButton() {
  const { toast } = useToast();
  const router = useRouter();

  const createDesignSnapshot = useMutation({
    mutationFn: (data: DesignSnapshot) => postDesignSnapshot(data),
    onSuccess: (data: any) => {
      router.push(`/cards/checkout?id=${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DesignSnapshot;
    
        createDesignSnapshot.mutate(parsed);
      } else {
        toast({
          title: "No saved design",
          description: "Please save your design before checkout.",
          variant: "destructive",
        });
      }
    } catch (e) {
    }
  };

  if (createDesignSnapshot.isPending) {
    return <LoadingScreen message="Creating design snapshot..." />;
  }

  return (
    <Button
      onClick={handleCheckout}
      className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
    >
      Checkout
    </Button>
  );
}
