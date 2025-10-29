"use client";

import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import CheckoutForm from "@/components/checkout-form";
// import CardPreview from "@/components/card-preview";
import { Button } from "@/components/ui/button";
import { CardPreview } from "@/components/card-preview";
import { DesignSnapshot } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, RefreshCw } from "lucide-react";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

   const fetchDesign = async (id: string): Promise<DesignSnapshot | null> => {
    // console.log("fetching design", id)
    const response = await fetch(`/api/design/${id}`);
    if (!response.ok) {
      throw new Error("Design not found");
    }
    const data = await response.json();
    // console.log("---- design data in invite page", data);
    const design = data as DesignSnapshot;
    return design;
  };

  const design = useQuery({
    queryKey: ["design"],
    queryFn: () => fetchDesign(id as string),
  });

  if (design.isLoading) {
      return <LoadingScreen message="Fetching Invitation Data ..." />;
    }

  if(!design.data) return (
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

        {/* Make right column wide enough to fit the 420px card without squeezing */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_520px]">
          {/* Left: payment form */}
          <div className="space-y-6">
            <CheckoutForm />
          </div>

          {/* Right: preview and summary */}
          <div className="space-y-6 md:sticky md:top-4 md:self-start md:max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <CardPreview design={design.data} />
          </div>
        </div>
      </div>
    </main>
  );
}
