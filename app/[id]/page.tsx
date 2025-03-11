"use client";

import { CardDesigner } from "@/components/card-designer";
import { Toaster } from "@/components/ui/toaster";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getDesign } from "@/lib/apis/design_apis";
import { LoadingScreen } from "@/components/loading-screen";

export default function Designer() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const design = useQuery({
    queryKey: ["design", params.id],
    queryFn: () => getDesign(params.id as string),
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
    return <LoadingScreen message="Fetching Design..." />;
  }

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
        <CardDesigner />
        <Toaster />
      </div>
    </main>
  );
}
