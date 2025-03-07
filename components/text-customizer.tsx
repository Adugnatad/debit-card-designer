"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CardDesign } from "@/components/card-designer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Info, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextCustomizerProps {
  text: string;
  textColor: string;
  cardDetailsTextColor: string;
  fontFamily: string;
  onTextChange: (updates: Partial<CardDesign>) => void;
}

export function TextCustomizer({
  text,
  textColor,
  cardDetailsTextColor,
  fontFamily,
  onTextChange,
}: TextCustomizerProps) {
  const fonts = [
    { name: "Inter", value: "Inter" },
    { name: "Roboto", value: "Roboto" },
    { name: "Montserrat", value: "Montserrat" },
    { name: "Playfair Display", value: "Playfair Display" },
    { name: "Courier New", value: "Courier New" },
  ];

  // Function to check if a color is too light for good visibility
  const isColorTooLight = (hexColor: string): boolean => {
    // Convert hex to RGB
    const r = Number.parseInt(hexColor.slice(1, 3), 16);
    const g = Number.parseInt(hexColor.slice(3, 5), 16);
    const b = Number.parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance (perceived brightness)
    // Formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if the color is too light (luminance > 0.7)
    return luminance > 0.7;
  };

  // Function to handle color input validation
  const validateAndUpdateColor = (
    colorValue: string,
    colorType: "textColor" | "cardDetailsTextColor"
  ) => {
    // Check if it's a valid hex color
    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue);

    if (isValidHex) {
      onTextChange({ [colorType]: colorValue });
    }
  };

  // Function to apply the same color to both text elements
  const applyColorToAll = (color: string) => {
    onTextChange({
      textColor: color,
      cardDetailsTextColor: color,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="custom-text">Custom Text</Label>
        <Input
          id="custom-text"
          value={text}
          onChange={(e) => onTextChange({ customText: e.target.value })}
          placeholder="Enter text to display on card"
          maxLength={24}
        />
        <p className="text-xs text-gray-500">Maximum 24 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="font-family">Font Style</Label>
        <Select
          value={fontFamily}
          onValueChange={(value) => onTextChange({ fontFamily: value })}
        >
          <SelectTrigger id="font-family">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Text Colors</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Customize the colors for different text elements on your card
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="name" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="name">Custom Text</TabsTrigger>
                <TabsTrigger value="details">Card Details</TabsTrigger>
              </TabsList>

              <TabsContent value="name" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    id="text-color"
                    value={textColor}
                    onChange={(e) =>
                      validateAndUpdateColor(e.target.value, "textColor")
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) =>
                      validateAndUpdateColor(e.target.value, "textColor")
                    }
                    className="flex-1"
                    maxLength={7}
                  />
                </div>
                {/* <div
                  className="p-3 rounded-md"
                  style={{ backgroundColor: textColor }}
                >
                  <p
                    className="text-center font-semibold"
                    style={{
                      color: isColorTooLight(textColor) ? "#000000" : "#ffffff",
                      textShadow: isColorTooLight(textColor)
                        ? "none"
                        : "0px 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    Preview: {text}
                  </p>
                </div> */}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    id="card-details-color"
                    value={cardDetailsTextColor}
                    onChange={(e) =>
                      validateAndUpdateColor(
                        e.target.value,
                        "cardDetailsTextColor"
                      )
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={cardDetailsTextColor}
                    onChange={(e) =>
                      validateAndUpdateColor(
                        e.target.value,
                        "cardDetailsTextColor"
                      )
                    }
                    className="flex-1"
                    maxLength={7}
                  />
                </div>
                {/* <div
                  className="p-3 rounded-md"
                  style={{ backgroundColor: "#0f172a" }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: `${cardDetailsTextColor}99` }}
                  >
                    VALID THRU
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: cardDetailsTextColor }}
                  >
                    12/28
                  </div>
                </div> */}
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyColorToAll(textColor)}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Apply name color to all
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => applyColorToAll(cardDetailsTextColor)}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Apply details color to all
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Tip: You can drag the name text on the card preview to position it
          exactly where you want.
        </p>
      </div>
    </div>
  );
}
