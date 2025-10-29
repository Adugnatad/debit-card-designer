"use client";

import { Toaster } from "@/components/ui/toaster";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/loading-screen";
import { DesignSnapshot } from "@/lib/types";
import CheckoutForm from "@/components/checkout-form";
import { CardPreview } from "@/components/card-preview";
// import CardPreview from "@/components/card-preview";

export default function Designer() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const fetchDesign = async (id: string): Promise<DesignSnapshot | null> => {
    const response = await fetch(`/api/card/${id}`);
    if (!response.ok) {
      throw new Error("Design not found");
    }
    const data = await response.json();
    // console.log("---- design data in invite page", data.design);
    const design = data.design as DesignSnapshot;
    return design;
  };

  const design = useQuery({
    queryKey: ["design"],
    queryFn: () => fetchDesign(params.id as string),
  });

  useEffect(() => {
    if (design.error) {
      router.push("/");
      toast({
        title: "Design not found",
        description:
          "The requested card design could not be found. Creating a new design instead.",
        variant: "destructive",
      });
    }
  }, [design.error]);

  if (design.isLoading) {
    return <LoadingScreen message="Fetching Invitation Data ..." />;
  }

  if(!design.data) return

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Custom Debit Card Designer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Design your own personalized debit card. Upload images, add text,
            and choose colors to create a card that's uniquely yours.
          </p>
        </div>

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
        <Toaster />
      </div>
    </main>
  );
}
