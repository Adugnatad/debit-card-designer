"use client";

import { useState } from "react";
import { CardPreview } from "@/components/card-preview";
import { ImageUploader } from "@/components/image-uploader";
import { TextCustomizer } from "@/components/text-customizer";
import { ColorSelector } from "@/components/color-selector";
import { OrderForm } from "@/components/order-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export type CardDesign = {
  backgroundImage: string | null;
  backgroundColor: string;
  customText: string;
  textColor: string;
  fontFamily: string;
  textPosition: { x: number; y: number };
  cardDetailsTextColor: string;
};

export function CardDesigner() {
  const [currentStep, setCurrentStep] = useState<"design" | "order">("design");
  const [cardDesign, setCardDesign] = useState<CardDesign>({
    backgroundImage: null,
    backgroundColor: "#0f172a",
    customText: "Your Custom Text",
    textColor: "#ffffff",
    fontFamily: "Inter",
    textPosition: { x: 30, y: 120 },
    cardDetailsTextColor: "#ffffff",
  });

  const handleImageUpload = (imageUrl: string) => {
    setCardDesign({
      ...cardDesign,
      backgroundImage: imageUrl,
    });
  };

  const handleColorChange = (color: string) => {
    setCardDesign({
      ...cardDesign,
      backgroundColor: color,
    });
  };

  const handleTextChange = (updates: Partial<CardDesign>) => {
    setCardDesign({
      ...cardDesign,
      ...updates,
    });
  };

  const handleTextPositionChange = (position: { x: number; y: number }) => {
    setCardDesign({
      ...cardDesign,
      textPosition: position,
    });
  };

  const handleProceedToOrder = () => {
    setCurrentStep("order");
  };

  const handleBackToDesign = () => {
    setCurrentStep("design");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {currentStep === "design" ? (
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="color">Color</TabsTrigger>
                </TabsList>
                <TabsContent value="image">
                  <ImageUploader onImageUpload={handleImageUpload} />
                </TabsContent>
                <TabsContent value="text">
                  <TextCustomizer
                    text={cardDesign.customText}
                    textColor={cardDesign.textColor}
                    cardDetailsTextColor={cardDesign.cardDetailsTextColor}
                    fontFamily={cardDesign.fontFamily}
                    onTextChange={handleTextChange}
                  />
                </TabsContent>
                <TabsContent value="color">
                  <ColorSelector
                    selectedColor={cardDesign.backgroundColor}
                    onColorChange={handleColorChange}
                  />
                </TabsContent>
              </Tabs>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleProceedToOrder}>Proceed to Order</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <OrderForm
            onBackToDesign={handleBackToDesign}
            cardDesign={cardDesign}
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <h2 className="text-xl font-semibold mb-4">Card Preview</h2>
          <CardPreview
            design={cardDesign}
            onTextPositionChange={handleTextPositionChange}
            isDraggable={currentStep === "design"}
          />
          <p className="text-sm text-gray-500 mt-4">
            This is a preview of how your card will look. You can drag the text
            to position it.
          </p>
        </div>
      </div>
    </div>
  );
}
