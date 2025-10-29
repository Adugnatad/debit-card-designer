"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { CardDesigner } from "@/components/card-designer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { CardDesign } from "@/lib/apis/gallery_apis";
import { useQueryClient } from "@tanstack/react-query";
import { galleryKeys } from "@/lib/query-client";
import { DesignSnapshot } from "@/lib/types";
import CardDesigner from "@/components/design";

export default function CardDesignPage() {
  const { toast } = useToast();

  const data = sessionStorage.getItem("editingCard")
    const queryClient = useQueryClient();
    const router = useRouter()

    const handleSuccess = () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all });
      router.push("/gallery")
    }

    if(!data) return (
      <div>
            <h1>We can't find editable card</h1>
        </div>
    )
    const initialData = JSON.parse(data) as DesignSnapshot

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
        <CardDesigner cardId={initialData.id} initialDesign={initialData} onSuccess={handleSuccess}  />
      </div>
    </main>
  );
}

