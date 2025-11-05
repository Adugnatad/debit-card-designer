"use client";

import { CardPreview } from "@/components/card-preview";
import CheckoutForm from "@/components/checkout-form";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DesignSnapshot, AnyLayer, BgMode, GradientState, TextLayer, ImageLayer, FixedChipLayer, FixedPanLayer, FixedExpiryLayer } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Helper function to map the backend layer to the frontend layer type
const mapLayer = (layer: any): AnyLayer => {
  switch (layer.type) {
    case "fixed_chip":
    case "fixed-pan":
    case "fixed_expiry":
    case "fixed-chip":
    case "fixed-pan":
    case "fixed-expiry":
      // Return the fixed layer types
      if (layer.type === "fixed_chip" || layer.type === "fixed-chip") {
        return { ...layer, type: "fixed-chip" } as FixedChipLayer;
      } else if (layer.type === "fixed-pan" || layer.type === "fixed-pan") {
        return { ...layer, type: "fixed-pan" } as FixedPanLayer;
      } else if (layer.type === "fixed_expiry" || layer.type === "fixed-expiry") {
        return { ...layer, type: "fixed-expiry" } as FixedExpiryLayer;
      }
      return { ...layer };
      
    case "image":
      return {
        ...layer,
        type: "image",
        src: layer.src || '',
        lockAspectRatio: layer.lockAspectRatio ?? true, // Default to true if undefined
      } as ImageLayer;

    case "text":
      return {
        ...layer,
        type: "text",
        text: layer.text || '',
        color: layer.color || "#000000",
        fontFamily: layer.fontFamily || "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontWeight: layer.fontWeight ?? 600, // Default to 600 if undefined
        align: layer.align || "left", // Default to "left" if undefined
      } as TextLayer;

    default:
      return { ...layer };
  }
};

// Helper function to map the backend design snapshot to the frontend format
const mapDesignSnapshot = (backendDesign: any): DesignSnapshot => {
  const bgMode: BgMode = backendDesign.bgMode === "image" ? "image" : backendDesign.bgMode === "gradient" ? "gradient" : "color";
  
  // Mapping gradient data if present
  const gradient: GradientState = backendDesign.gradient
    ? {
        kind: backendDesign.gradient.kind || "linear",
        angle: backendDesign.gradient.angle || 0,
        stops: backendDesign.gradient.stops || []
      }
    : { kind: "linear", angle: 0, stops: [] };

  // Mapping layers
  const layers = backendDesign.layers.map(mapLayer);

  return {
    id: backendDesign.id,
    v: backendDesign.v,
    bgMode,
    bgColor: backendDesign.bgColor || "#ffffff", // Default to white if no color
    gradient,
    bgImage: backendDesign.bgImage,
    bg: {
      x: backendDesign.bgX ?? 0,
      y: backendDesign.bgY ?? 0,
      w: backendDesign.bgW ?? 420, // Default to CARD_W if undefined
      h: backendDesign.bgH ?? 265, // Default to CARD_H if undefined
      lockAspect: backendDesign.bgLockAspect ?? true, // Default to true if undefined
    },
    layers,
  };
};

const fetchDesign = async (id: string): Promise<DesignSnapshot | null> => {
  const response = await fetch(`/api/design/${id}`);
  if (!response.ok) {
    throw new Error("Design not found");
  }
  const data = await response.json();
  
  // Convert the backend structure to the frontend format
  const design = mapDesignSnapshot(data);
  
  return design;
};

// Component code
export default function CheckoutPage() {
 const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const design = useQuery({
    queryKey: ["design"],
    queryFn: () => fetchDesign(id as string),
  });

  if (design.isLoading) {
    return <LoadingScreen message="Fetching Invitation Data ..." />;
  }

  if (!design.data) return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Card Requests Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">
            Failed to fetch gallery
          </p>
          <Button onClick={() => design.refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Checkout
          </h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Designer</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_520px]">
          <div className="space-y-6">
            <CheckoutForm />
          </div>

          <div className="space-y-6 md:sticky md:top-4 md:self-start md:max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <CardPreview design={design.data} />
          </div>
        </div>
      </div>
    </main>
  );
}
