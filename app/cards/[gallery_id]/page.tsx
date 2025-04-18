"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CardDesigner } from "@/components/card-designer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { CardDesign } from "@/lib/apis/gallery_apis";

export default function CardDesignPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [cardDesign, setCardDesign] = useState();
  const [cardId, setCardId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = params.gallery_id as string;

    if (id === "new") {
      // Create a new design
      router.push("/cards/new");
    } else {
      // Load gallery design
      const galleryItem = searchParams.get("design");
      if (galleryItem) {
        const parsedDesign = JSON.parse(galleryItem);
        setCardDesign(parsedDesign);
        setCardId(id);
      } else {
        // Handle case where design doesn't exist
        toast({
          title: "Design not found",
          description:
            "The requested card design could not be found. Creating a new design instead.",
          variant: "destructive",
        });
        router.push("/cards/new");
      }
      setIsLoading(false);
    }
  }, [params.id, router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading design...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {cardId ? "Edit Card Design" : "Create New Card Design"}
          </h1>
          {cardId && (
            <p className="text-sm text-gray-500 mt-2">Design ID: {cardId}</p>
          )}
        </div>

        <CardDesignerWrapper
          design={cardDesign}
          onDesignChange={setCardDesign}
        />
      </div>
    </main>
  );
}

interface CardDesignerWrapperProps {
  design: CardDesign | undefined;
  onDesignChange: (design: any) => void;
}

function CardDesignerWrapper({
  design,
  onDesignChange,
}: CardDesignerWrapperProps) {
  return (
    <div className="card-designer-wrapper">
      <CardDesigner
        template={design}
        gallery={design?.backgroundImage ?? undefined}
      />
    </div>
  );
}
