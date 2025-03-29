"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCardDesigns } from "@/lib/card-store";
import { CardPreview } from "@/components/card-preview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CardDesign } from "@/components/card-designer";

interface GalleryItem {
  id: string;
  design: CardDesign;
}

export default function GalleryPage() {
  const [designs, setDesigns] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all designs
    const allDesigns = getAllCardDesigns();
    setDesigns(allDesigns);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading gallery...</div>
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
          <Link href="/cards/new">
            <Button className="gap-2" style={{ backgroundColor: "#187154" }}>
              <PlusCircle className="h-4 w-4" />
              Create New Design
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#006241]">
            Card Design Gallery
          </h1>
          <p className="text-[#374151] mt-2">
            Browse through our sample card designs or create your own
          </p>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No saved designs found</p>
            <Link href="/cards/new">
              <Button>Create Your First Design</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {designs.map((item) => (
              <Link href={`/cards/${item.id}`} key={item.id}>
                {/* <Card className="hover:shadow-md transition-shadow cursor-pointer h-full"> */}
                <CardContent className="p-4">
                  <div className="mb-4">
                    <CardPreview
                      design={item.design}
                      isDraggable={false}
                      isTemplate={true}
                    />
                  </div>
                  <h3 className="font-medium text-center truncate leading-relaxed">
                    {item.design.customText}
                  </h3>
                </CardContent>
                {/* </Card> */}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
