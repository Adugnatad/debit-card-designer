"use client";

import { useRef, useState } from "react";
import { CardPreview } from "@/components/card-preview";
import { ImageUploader } from "@/components/image-uploader";
import { TextCustomizer } from "@/components/text-customizer";
import { ColorSelector } from "@/components/color-selector";
import { OrderForm } from "@/components/order-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LogoUploader } from "./logo-uploader";

export type CardDesign = {
  backgroundImage: string | null;
  backgroundColor: string;
  customText: string;
  textColor: string;
  fontFamily: string;
  textPosition: { x: number; y: number };
  logoPosition: { x: number; y: number };
  cardDetailsTextColor: string;
  logo: string | null;
};

export function CardDesigner(design?: any) {
  const [currentStep, setCurrentStep] = useState<"design" | "order">("design");
  const [cardDesign, setCardDesign] = useState<CardDesign>({
    backgroundImage: null,
    backgroundColor: "#0f172a",
    customText: "Your Custom Text",
    textColor: "#ffffff",
    fontFamily: "Inter",
    textPosition: { x: 30, y: 120 },
    cardDetailsTextColor: "#ffffff",
    logoPosition: { x: 50, y: 140 },
    logo: null,
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

  const handleLogoPositionChange = (position: { x: number; y: number }) => {
    setCardDesign({
      ...cardDesign,
      logoPosition: position,
    });
  };

  const handleProceedToOrder = () => {
    setCurrentStep("order");
  };

  const handleBackToDesign = () => {
    setCurrentStep("design");
  };

  const handleLogoUpload = (imageUrl: string) => {
    setCardDesign({
      ...cardDesign,
      logo: imageUrl,
    });
  };

  const passCardPreviewScreenshot = useRef<{
    handleCardScreenshot: () => string;
  }>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {currentStep === "design" ? (
          <Card>
            <CardContent className="p-6">
              {design.design ? (
                <p className="text-red-500">
                  Design customization is disabled for invited users.
                </p>
              ) : (
                <Tabs defaultValue="image" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="image">Image</TabsTrigger>
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="color">Color</TabsTrigger>
                    <TabsTrigger value="logo">Logo</TabsTrigger>
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
                  <TabsContent value="logo">
                    <LogoUploader onImageUpload={handleLogoUpload} />
                  </TabsContent>
                </Tabs>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleProceedToOrder}>Proceed to Order</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <OrderForm
            onBackToDesign={handleBackToDesign}
            cardDesign={cardDesign}
            triggerScreenshot={async () =>
              passCardPreviewScreenshot.current?.handleCardScreenshot() || ""
            }
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <h2 className="text-xl font-semibold mb-4">Card Preview</h2>
          <CardPreview
            design={cardDesign}
            groupImage={design.design?.image}
            groupCreator={design.design?.creator_name}
            onTextPositionChange={handleTextPositionChange}
            isDraggable={currentStep === "design"}
            onLogoPositionChange={handleLogoPositionChange}
            ref={passCardPreviewScreenshot}
          />
        </div>
      </div>
    </div>
  );
}
