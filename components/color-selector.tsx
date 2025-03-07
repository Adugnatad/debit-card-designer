"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface ColorSelectorProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

export function ColorSelector({ selectedColor, onColorChange }: ColorSelectorProps) {
  const presetColors = [
    { name: "Navy Blue", value: "#0f172a" },
    { name: "Royal Blue", value: "#1e40af" },
    { name: "Emerald", value: "#047857" },
    { name: "Purple", value: "#7e22ce" },
    { name: "Rose", value: "#be185d" },
    { name: "Slate", value: "#334155" },
    { name: "Black", value: "#0f0f0f" },
    { name: "Gold", value: "#b7791f" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-color">Card Background Color</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            id="card-color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-12 h-10 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1"
            maxLength={7}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preset Colors</Label>
        <div className="grid grid-cols-4 gap-2">
          {presetColors.map((color) => (
            <Button
              key={color.value}
              type="button"
              variant="outline"
              className="p-0 h-12 w-full overflow-hidden"
              onClick={() => onColorChange(color.value)}
            >
              <div className="flex flex-col w-full h-full">
                <div className="flex-1" style={{ backgroundColor: color.value }}></div>
                <div className="text-xs p-1 truncate">{color.name}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">Choose a preset color or enter a custom hex color code.</p>
      </div>
    </div>
  )
}

