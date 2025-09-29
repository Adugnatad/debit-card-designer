"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  BringToFront,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Layers,
  Paintbrush,
  Redo2,
  SendToBack,
  Trash2,
  TypeIcon,
  Upload,
  Download,
  Plus,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AnyLayer,
  BgMode,
  DesignSnapshot,
  GradientState,
  GradientStop,
  ImageLayer,
  STORAGE_KEY,
  TextLayer,
} from "@/lib/types";

// Card dimensions (px) — ~85.6 x 53.98 mm ratio
const CARD_W = 420;
const CARD_H = 265;

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_TEXT: Omit<TextLayer, "id" | "name" | "type"> = {
  text: "Your Text",
  color: "#111111",
  fontFamily:
    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontWeight: 600,
  align: "left",
  x: 40,
  y: 40,
  w: 180,
  h: 48,
  z: 0,
};

const DEFAULT_IMAGE: Omit<ImageLayer, "id" | "name" | "type" | "src"> = {
  lockAspectRatio: true,
  x: 220,
  y: 40,
  w: 120,
  h: 80,
  z: 0,
};

const ISSUER_LAYER_ID = "issuer-logo";

const FIXED_LAYERS: AnyLayer[] = [
  {
    id: "chip",
    name: "Chip",
    type: "fixed-chip",
    locked: true,
    x: 36,
    y: 78,
    w: 52,
    h: 40,
  },
  {
    id: "pan",
    name: "Card Number",
    type: "fixed-pan",
    locked: true,
    x: 36,
    y: 168,
  },
  {
    id: "exp",
    name: "Expiry",
    type: "fixed-expiry",
    locked: true,
    x: 36,
    y: 200,
  },
];

const SYSTEM_FONTS = [
  {
    label: "System",
    value:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },
  { label: "Serif", value: 'Georgia, "Times New Roman", Times, serif' },
  {
    label: "Monospace",
    value:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  {
    label: "Rounded",
    value: '"Trebuchet MS", "Gill Sans", "Avenir Next", Arial, sans-serif',
  },
];

export default function CardDesigner() {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Background mode & controls
  const [bgMode, setBgMode] = useState<BgMode>("color");
  const [bgColor, setBgColor] = useState("#E8E5E2");

  const [gradient, setGradient] = useState<GradientState>({
    kind: "linear",
    angle: 45,
    stops: [
      { id: uid("stop"), color: "#ffffff", pos: 0 },
      { id: uid("stop"), color: "#d6d3d1", pos: 100 },
    ],
  });

  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bg, setBg] = useState({
    x: 0,
    y: 0,
    w: CARD_W,
    h: CARD_H,
    lockAspect: false,
  });

  // Layers include dynamic and fixed
  const [layers, setLayers] = useState<AnyLayer[]>(() => {
    return [...FIXED_LAYERS];
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(1);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId),
    [layers, selectedId]
  );

  const onUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addTextLayer = () => {
    const id = uid("text");
    const newLayer: TextLayer = {
      id,
      name: "Text",
      type: "text",
      ...DEFAULT_TEXT,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(id);
  };

  const addLogoLayer = async (file?: File) => {
    let src = "";
    if (file) {
      src = await onUpload(file);
    } else {
      const input = document.getElementById(
        "logo-file-input"
      ) as HTMLInputElement | null;
      input?.click();
      return;
    }
    const id = uid("img");
    const newLayer: ImageLayer = {
      id,
      name: "Logo",
      type: "image",
      src,
      ...DEFAULT_IMAGE,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(id);
  };

  function addIssuerLogo() {
    const w = 140;
    const h = 60;
    const x = CARD_W - w - 16;
    const y = 16;
    const newLayer: ImageLayer = {
      id: ISSUER_LAYER_ID,
      name: "Issuer Logo",
      type: "image",
      src: "/images/coop-logo.png",
      lockAspectRatio: true,
      x,
      y,
      w,
      h,
      z: 0,
    };
    setLayers((prev) => {
      if (prev.some((l) => l.id === ISSUER_LAYER_ID)) return prev;
      return [...prev, newLayer];
    });
  }

  const setLayer = (id: string, updater: (l: AnyLayer) => AnyLayer) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (
    id: string,
    direction: "up" | "down" | "front" | "back"
  ) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const layer = prev[idx];
      if (layer.locked) return prev;

      const arr = [...prev];
      arr.splice(idx, 1);

      if (direction === "up") {
        const newIdx = Math.min(idx + 1, prev.length - 1);
        arr.splice(newIdx, 0, layer);
      } else if (direction === "down") {
        const newIdx = Math.max(idx - 1, 0);
        arr.splice(newIdx, 0, layer);
      } else if (direction === "front") {
        arr.push(layer);
      } else if (direction === "back") {
        arr.unshift(layer);
      }
      return arr;
    });
  };

  const bringSelectedForward = () => {
    if (!selectedId) return;
    moveLayer(selectedId, "up");
  };
  const sendSelectedBackward = () => {
    if (!selectedId) return;
    moveLayer(selectedId, "down");
  };
  const bringSelectedToFront = () => {
    if (!selectedId) return;
    moveLayer(selectedId, "front");
  };
  const sendSelectedToBack = () => {
    if (!selectedId) return;
    moveLayer(selectedId, "back");
  };

  const handleBgUploadClick = () => {
    const input = document.getElementById(
      "bg-file-input"
    ) as HTMLInputElement | null;
    input?.click();
  };

  const handleBgFile = async (file?: File) => {
    if (!file) return;
    const src = await onUpload(file);
    setBgImage(src);
    setBg((prev) => ({ ...prev, x: 0, y: 0, w: CARD_W, h: CARD_H }));
    setBgMode("image");
  };

  const handleLogoFile = async (file?: File) => {
    if (!file) return;
    await addLogoLayer(file);
  };

  // Gradient CSS
  const gradientCss = useMemo(() => {
    const stops = [...gradient.stops]
      .sort((a, b) => a.pos - b.pos)
      .map((s) => `${s.color} ${s.pos}%`)
      .join(", ");
    if (gradient.kind === "linear") {
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
    }
    return `radial-gradient(circle at center, ${stops})`;
  }, [gradient]);

  // Derived styling for card
  const cardStyle = useMemo(() => {
    const base: React.CSSProperties = {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 16,
      boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
      overflow: "hidden",
      position: "relative",
      backgroundColor: bgColor,
    };
    if (bgMode === "gradient") {
      return { ...base, backgroundImage: gradientCss };
    }
    // image mode uses <img> RND; color mode is base
    return base;
  }, [bgColor, bgMode, gradientCss]);

  // Helpers for text rendering based on h
  const fontSizeFromHeight = (h: number) => Math.max(10, Math.round(h * 0.6));

  // PAN and expiry (fixed content)
  const PAN_TEXT = "4567 1234 5678 9012";
  const EXPIRY_TEXT = "12/29";

  // Emboss utilities
  const embossedShadow =
    "-1px -1px 0 rgba(255,255,255,0.75), 1px 1px 0 rgba(0,0,0,0.35)";
  function embossedTextStyle(
    elementX: number,
    elementY: number
  ): React.CSSProperties {
    if (bgMode === "image" && bgImage) {
      // Clip the background image into the text, aligned to the card image
      return {
        color: "transparent",
        WebkitTextFillColor: "transparent",
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${bg.w}px ${bg.h}px`,
        backgroundPosition: `${bg.x - elementX}px ${bg.y - elementY}px`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        textShadow: embossedShadow,
      };
    }
    if (bgMode === "gradient") {
      // Clip the same gradient into the text
      return {
        color: "transparent",
        WebkitTextFillColor: "transparent",
        backgroundImage: gradientCss,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        textShadow: embossedShadow,
      };
    }
    // Solid color
    return {
      color: bgColor,
      textShadow: embossedShadow,
    };
  }

  async function exportAsPng() {
    if (!cardRef.current) return;
    setExporting(true);
    // Wait a frame so the exporting styles (no radius) apply before capture
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );
    try {
      const blob = await htmlToImage.toBlob(cardRef.current, {
        pixelRatio: exportScale,
        backgroundColor: bgColor,
        cacheBust: true,
        filter: (node) => {
          const el = node as HTMLElement;
          // Exclude fixed chip/PAN/expiry and the issuer logo from export
          if (!el) return true;
          if (el.closest?.('[data-fixed="true"], .issuer-logo')) return false;
          return true;
        },
      });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `virtual-card-${exportScale}x-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PNG", err);
    } finally {
      setExporting(false);
    }
  }

  // Gradient stop helpers
  const addGradientStop = () => {
    const lastPos = Math.min(
      100,
      Math.max(0, (gradient.stops[gradient.stops.length - 1]?.pos ?? 100) - 0)
    );
    setGradient((g) => ({
      ...g,
      stops: [
        ...g.stops,
        {
          id: uid("stop"),
          color: "#999999",
          pos: Math.min(100, Math.max(0, lastPos - 10)),
        },
      ],
    }));
  };
  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    setGradient((g) => ({
      ...g,
      stops: g.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };
  const removeStop = (id: string) => {
    setGradient((g) => {
      if (g.stops.length <= 2) return g; // keep at least 2
      return { ...g, stops: g.stops.filter((s) => s.id !== id) };
    });
  };

  function makeSnapshot(): DesignSnapshot {
    return {
      v: 1,
      bgMode,
      bgColor,
      gradient,
      bgImage,
      bg,
      layers,
    };
  }

  function applySnapshot(s: DesignSnapshot) {
    try {
      setBgMode(s.bgMode);
      setBgColor(s.bgColor);
      setGradient(s.gradient);
      setBgImage(s.bgImage);
      setBg(s.bg);
      // basic validation to avoid empty/invalid arrays
      if (Array.isArray(s.layers) && s.layers.length > 0) {
        setLayers(s.layers as AnyLayer[]);
      } else {
        setLayers([...FIXED_LAYERS]);
      }
      setSelectedId(null);
    } catch (e) {
      console.error("Failed to apply snapshot", e);
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot()));
      const ts = Date.now();
      setLastSavedAt(ts);
      toast({
        title: "Design saved",
        description: new Date(ts).toLocaleTimeString(),
      });
    } catch (e) {
      console.error("Save failed", e);
      toast({
        title: "Save failed",
        description: "Could not save design.",
        variant: "destructive",
      });
    }
  }

  function loadFromLocalStorage(showToast = true) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (showToast)
          toast({ title: "No saved design found", variant: "destructive" });
        return;
      }
      const parsed = JSON.parse(raw) as DesignSnapshot;
      applySnapshot(parsed);
      if (showToast) toast({ title: "Design loaded" });
    } catch (e) {
      console.error("Load failed", e);
      if (showToast)
        toast({
          title: "Load failed",
          description: "Could not load saved design.",
          variant: "destructive",
        });
    }
  }

  function resetDesign() {
    setBgMode("color");
    setBgColor("#E8E5E2");
    setGradient({
      kind: "linear",
      angle: 45,
      stops: [
        { id: uid("stop"), color: "#ffffff", pos: 0 },
        { id: uid("stop"), color: "#d6d3d1", pos: 100 },
      ],
    });
    setBgImage(null);
    setBg({ x: 0, y: 0, w: CARD_W, h: CARD_H, lockAspect: false });
    setLayers([...FIXED_LAYERS]);
    setSelectedId(null);
    localStorage.removeItem(STORAGE_KEY);
    setLastSavedAt(null);
    toast({ title: "Design reset" });
  }

  useEffect(() => {
    // Attempt auto-restore on first mount
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DesignSnapshot;
        applySnapshot(parsed);
        setLastSavedAt(Date.now());
        toast({ title: "Restored saved design" });
      }
    } catch (e) {
      console.warn("No valid saved design to restore");
    }
    // Ensure issuer logo is present in the canvas
    addIssuerLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot()));
        setLastSavedAt(Date.now());
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgMode, bgColor, gradient, bgImage, bg, layers]);

  return (
    <div className="grid gap-6 md:grid-cols-[360px_minmax(0,1fr)]">
      {/* Tools Panel */}
      <section className="space-y-6 md:sticky md:top-4 md:self-start md:max-h-[calc(100dvh-2rem)] overflow-y-auto pr-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={saveToLocalStorage}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadFromLocalStorage(true)}
              >
                Load
              </Button>
              <Button size="sm" variant="ghost" onClick={resetDesign}>
                Reset
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {lastSavedAt
                ? `Autosaved ${new Date(lastSavedAt).toLocaleTimeString()}`
                : "Not saved yet"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Paintbrush className="h-4 w-4" />
              Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fill mode</Label>
                <Select
                  value={bgMode}
                  onValueChange={(v: BgMode) => setBgMode(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Background type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Solid color</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bgMode === "gradient" && (
                <div className="space-y-2">
                  <Label>Gradient type</Label>
                  <Select
                    value={gradient.kind}
                    onValueChange={(v: "linear" | "radial") =>
                      setGradient((g) => ({ ...g, kind: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gradient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="radial">Radial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Solid color */}
            {bgMode === "color" && (
              <div className="space-y-2">
                <Label htmlFor="bg-color">Background color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-16 p-1"
                    aria-label="Background color"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono"
                    aria-label="Background hex value"
                  />
                </div>
              </div>
            )}

            {/* Gradient controls */}
            {bgMode === "gradient" && (
              <div className="space-y-4">
                {gradient.kind === "linear" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Direction ({gradient.angle}°)</Label>
                      <span className="text-xs text-muted-foreground">
                        0° = to right
                      </span>
                    </div>
                    <Slider
                      value={[gradient.angle]}
                      min={0}
                      max={360}
                      step={1}
                      onValueChange={([val]) =>
                        setGradient((g) => ({ ...g, angle: val }))
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Color stops</Label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addGradientStop}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add stop
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {[...gradient.stops]
                      .sort((a, b) => a.pos - b.pos)
                      .map((stop) => (
                        <div key={stop.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-3">
                            <Input
                              type="color"
                              value={stop.color}
                              onChange={(e) =>
                                updateStop(stop.id, { color: e.target.value })
                              }
                              className="h-10 w-12 p-1"
                              aria-label="Gradient stop color"
                            />
                            <Input
                              value={stop.color}
                              onChange={(e) =>
                                updateStop(stop.id, { color: e.target.value })
                              }
                              className="font-mono"
                              aria-label="Gradient stop color hex"
                            />
                            <div className="ml-auto flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {stop.pos}%
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeStop(stop.id)}
                                disabled={gradient.stops.length <= 2}
                                title="Remove stop"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Slider
                              value={[stop.pos]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={([val]) =>
                                updateStop(stop.id, { pos: val })
                              }
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Image controls */}
            {bgMode === "image" && (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBgUploadClick}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBgImage(null);
                      setBg({
                        x: 0,
                        y: 0,
                        w: CARD_W,
                        h: CARD_H,
                        lockAspect: false,
                      });
                    }}
                    disabled={!bgImage}
                  >
                    <Redo2 className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lock aspect ratio</p>
                    <p className="text-xs text-muted-foreground">
                      Keep background image proportions
                    </p>
                  </div>
                  <Switch
                    checked={bg.lockAspect}
                    onCheckedChange={(v) =>
                      setBg((prev) => ({ ...prev, lockAspect: v }))
                    }
                    aria-label="Lock background image aspect ratio"
                  />
                </div>
                <input
                  id="bg-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBgFile(e.target.files?.[0])}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={addTextLayer}>
                <TypeIcon className="mr-2 h-4 w-4" />
                Add Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addLogoLayer()}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Add Logo
              </Button>
              <input
                id="logo-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
              />
            </div>

            <div className="rounded-md border">
              <ul className="max-h-72 overflow-auto divide-y">
                {layers.map((layer, idx) => {
                  const isSelected = layer.id === selectedId;
                  return (
                    <li
                      key={layer.id}
                      className={cn(
                        "flex items-center gap-2 p-2 text-sm hover:bg-accent/50 focus-within:bg-accent/50",
                        isSelected && "bg-accent/60"
                      )}
                    >
                      <button
                        className="flex-1 text-left outline-none"
                        onClick={() => setSelectedId(layer.id)}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          {layer.type === "text" && (
                            <TypeIcon className="h-4 w-4" />
                          )}
                          {layer.type === "image" && (
                            <ImageIcon className="h-4 w-4" />
                          )}
                          {layer.type.startsWith("fixed") && (
                            <Layers className="h-4 w-4" />
                          )}
                          <span className="font-medium">{layer.name}</span>
                          {layer.locked && (
                            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                              fixed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Index {idx} • {layer.type}
                        </p>
                      </button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLayer(layer.id, "down")}
                          disabled={layer.locked}
                          title="Send backward"
                          aria-label="Send backward"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLayer(layer.id, "up")}
                          disabled={layer.locked}
                          title="Bring forward"
                          aria-label="Bring forward"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLayer(layer.id, "back")}
                          disabled={layer.locked}
                          title="Send to back"
                          aria-label="Send to back"
                        >
                          <SendToBack className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLayer(layer.id, "front")}
                          disabled={layer.locked}
                          title="Bring to front"
                          aria-label="Bring to front"
                        >
                          <BringToFront className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteLayer(layer.id)}
                          disabled={layer.locked}
                          title="Delete layer"
                          aria-label="Delete layer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sendSelectedBackward}
              disabled={
                !selectedId || layers.find((l) => l.id === selectedId)?.locked
              }
            >
              <SendToBack className="mr-2 h-4 w-4" />
              Send Backward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={bringSelectedForward}
              disabled={
                !selectedId || layers.find((l) => l.id === selectedId)?.locked
              }
            >
              <BringToFront className="mr-2 h-4 w-4" />
              Bring Forward
            </Button>
          </CardFooter>
        </Card>

        {/* Properties for selected layer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedLayer && (
              <p className="text-sm text-muted-foreground">
                Select a text or logo layer to edit.
              </p>
            )}

            {selectedLayer?.type === "text" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-content">Text</Label>
                  <Input
                    id="text-content"
                    value={selectedLayer.text}
                    onChange={(e) =>
                      setLayer(selectedLayer.id, (l) => ({
                        ...(l as TextLayer),
                        text: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Font family</Label>
                    <Select
                      value={selectedLayer.fontFamily}
                      onValueChange={(v) =>
                        setLayer(selectedLayer.id, (l) => ({
                          ...(l as TextLayer),
                          fontFamily: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Font" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_FONTS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Select
                      value={String(selectedLayer.fontWeight)}
                      onValueChange={(v) =>
                        setLayer(selectedLayer.id, (l) => ({
                          ...(l as TextLayer),
                          fontWeight: Number(v),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color kept for compatibility, but embossed render matches background */}
                <div className="space-y-2">
                  <Label htmlFor="text-color">
                    Color (not used in embossed render)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e) =>
                        setLayer(selectedLayer.id, (l) => ({
                          ...(l as TextLayer),
                          color: e.target.value,
                        }))
                      }
                      className="h-10 w-16 p-1"
                      aria-label="Text color"
                    />
                    <Input
                      value={selectedLayer.color}
                      onChange={(e) =>
                        setLayer(selectedLayer.id, (l) => ({
                          ...(l as TextLayer),
                          color: e.target.value,
                        }))
                      }
                      className="font-mono"
                      aria-label="Text color hex"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Size</Label>
                  <Slider
                    value={[
                      fontSizeFromHeight(selectedLayer.h ?? DEFAULT_TEXT.h!),
                    ]}
                    min={10}
                    max={64}
                    step={1}
                    onValueChange={([val]) =>
                      setLayer(selectedLayer.id, (l) => {
                        const tl = l as TextLayer;
                        const newH = Math.round(val / 0.6);
                        return { ...tl, h: newH };
                      })
                    }
                  />
                </div>
              </div>
            )}

            {selectedLayer?.type === "image" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lock aspect ratio</p>
                    <p className="text-xs text-muted-foreground">
                      Keep logo proportions when resizing
                    </p>
                  </div>
                  <Switch
                    checked={selectedLayer.lockAspectRatio}
                    onCheckedChange={(v) =>
                      setLayer(selectedLayer.id, (l) => ({
                        ...(l as ImageLayer),
                        lockAspectRatio: v,
                      }))
                    }
                    aria-label="Lock logo aspect ratio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Replace logo</Label>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const src = await onUpload(f);
                        setLayer(selectedLayer.id, (l) => ({
                          ...(l as ImageLayer),
                          src,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Preview Panel */}
      <section className="flex flex-col items-center md:sticky md:top-4 md:self-start md:max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="w-full">
          <Card className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={String(exportScale)}
                  onValueChange={(v) => setExportScale(Number(v) as 1 | 2 | 3)}
                >
                  <SelectTrigger
                    className="w-[110px]"
                    aria-label="Export scale"
                  >
                    <SelectValue placeholder="Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Export 1x</SelectItem>
                    <SelectItem value="2">Export 2x</SelectItem>
                    <SelectItem value="3">Export 3x</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={exportAsPng} disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export PNG"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div
                  ref={cardRef}
                  className="relative select-none"
                  style={{ ...cardStyle, borderRadius: exporting ? 0 : 16 }}
                  aria-label="Card design canvas"
                >
                  {/* Background image layer (only when in image mode) */}
                  {bgMode === "image" && bgImage && (
                    <Rnd
                      size={{ width: bg.w, height: bg.h }}
                      position={{ x: bg.x, y: bg.y }}
                      onDragStop={(_, d) =>
                        setBg((prev) => ({
                          ...prev,
                          x: Math.round(d.x),
                          y: Math.round(d.y),
                        }))
                      }
                      onResizeStop={(_, __, ref, ___, pos) => {
                        setBg({
                          x: Math.round(pos.x),
                          y: Math.round(pos.y),
                          w: Math.round(ref.offsetWidth),
                          h: Math.round(ref.offsetHeight),
                          lockAspect: bg.lockAspect,
                        });
                      }}
                      bounds="parent"
                      lockAspectRatio={bg.lockAspect}
                      style={{ zIndex: 0 }}
                      enableUserSelectHack={false}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bgImage || "/placeholder.svg"}
                        alt="Background"
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </Rnd>
                  )}

                  {/* Textures and sheen overlay for tactile feel */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      zIndex: 1000,
                      backgroundImage:
                        "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 30%, rgba(0,0,0,0.10) 70%, rgba(0,0,0,0.25) 100%)",
                      mixBlendMode: "soft-light",
                    }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      zIndex: 1001,
                      backgroundImage: "url(/images/noise.png)",
                      backgroundRepeat: "repeat",
                      backgroundSize: "128px 128px",
                      mixBlendMode: "overlay",
                    }}
                  />

                  {/* Render all layers in stacking order by array order */}
                  {layers.map((layer, index) => {
                    const isSelected = selectedId === layer.id;
                    const commonStyle: React.CSSProperties = {
                      zIndex: index + 2, // keep above bg and under overlays
                    };

                    if (layer.type === "fixed-chip") {
                      return (
                        <div
                          key={layer.id}
                          className="absolute"
                          data-fixed="true"
                          style={{
                            left: layer.x,
                            top: layer.y,
                            width: layer.w,
                            height: layer.h,
                            ...commonStyle,
                          }}
                          aria-label="Card chip"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/images/chip.png"
                            alt="EMV chip"
                            className="h-full w-full object-contain opacity-90"
                            draggable={false}
                          />
                        </div>
                      );
                    }

                    if (layer.type === "fixed-pan") {
                      const x = layer.x ?? 0;
                      const y = layer.y ?? 0;
                      return (
                        <div
                          key={layer.id}
                          className="absolute"
                          data-fixed="true"
                          style={{
                            left: x,
                            top: y,
                            ...commonStyle,
                          }}
                          aria-label="Card number"
                        >
                          <div
                            className="font-semibold tracking-widest"
                            style={{
                              fontSize: 20,
                              letterSpacing: "0.12em",
                              ...embossedTextStyle(x, y),
                            }}
                          >
                            {PAN_TEXT}
                          </div>
                        </div>
                      );
                    }

                    if (layer.type === "fixed-expiry") {
                      const x = layer.x ?? 0;
                      const y = layer.y ?? 0;
                      return (
                        <div
                          key={layer.id}
                          className="absolute"
                          data-fixed="true"
                          style={{
                            left: x,
                            top: y,
                            ...commonStyle,
                          }}
                          aria-label="Expiry date"
                        >
                          <div
                            className="text-[10px] mb-1"
                            style={{
                              opacity: 0.7,
                              ...embossedTextStyle(x, y - 14),
                            }}
                          >
                            {"VALID THRU"}
                          </div>
                          <div
                            className="font-semibold tracking-wide"
                            style={{
                              fontSize: 14,
                              letterSpacing: "0.08em",
                              ...embossedTextStyle(x, y),
                            }}
                          >
                            {EXPIRY_TEXT}
                          </div>
                        </div>
                      );
                    }

                    if (layer.type === "text") {
                      const tl = layer as TextLayer;
                      const fontSize = fontSizeFromHeight(
                        tl.h ?? DEFAULT_TEXT.h!
                      );
                      const x = tl.x ?? DEFAULT_TEXT.x;
                      const y = tl.y ?? DEFAULT_TEXT.y;
                      return (
                        <Rnd
                          key={tl.id}
                          bounds="parent"
                          size={{
                            width: tl.w ?? DEFAULT_TEXT.w!,
                            height: tl.h ?? DEFAULT_TEXT.h!,
                          }}
                          position={{ x: x!, y: y! }}
                          onDragStart={() => setSelectedId(tl.id)}
                          onDragStop={(_, d) =>
                            setLayer(tl.id, (l) => ({
                              ...(l as TextLayer),
                              x: Math.round(d.x),
                              y: Math.round(d.y),
                            }))
                          }
                          onResizeStart={() => setSelectedId(tl.id)}
                          onResizeStop={(_, __, ref, ___, pos) =>
                            setLayer(tl.id, (l) => ({
                              ...(l as TextLayer),
                              x: Math.round(pos.x),
                              y: Math.round(pos.y),
                              w: Math.round(ref.offsetWidth),
                              h: Math.round(ref.offsetHeight),
                            }))
                          }
                          style={{
                            ...commonStyle,
                            border: exporting
                              ? "none"
                              : isSelected
                              ? "2px solid var(--ring)"
                              : "1px dashed rgba(0,0,0,0.15)",
                            borderRadius: 8,
                            background: "transparent",
                            padding: 4,
                          }}
                          enableUserSelectHack={false}
                        >
                          <div
                            className="h-full w-full"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent:
                                tl.align === "center"
                                  ? "center"
                                  : tl.align === "right"
                                  ? "flex-end"
                                  : "flex-start",
                              fontFamily: tl.fontFamily,
                              fontWeight: tl.fontWeight,
                              fontSize,
                              lineHeight: 1.1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              userSelect: "none",
                              ...embossedTextStyle(x!, y!),
                            }}
                            onMouseDown={() => setSelectedId(tl.id)}
                          >
                            {tl.text}
                          </div>
                        </Rnd>
                      );
                    }

                    if (layer.type === "image") {
                      const il = layer as ImageLayer;
                      const isIssuer = layer.id === ISSUER_LAYER_ID;
                      return (
                        <Rnd
                          key={il.id}
                          className={cn(isIssuer && "issuer-logo")}
                          bounds="parent"
                          size={{
                            width: il.w ?? DEFAULT_IMAGE.w!,
                            height: il.h ?? DEFAULT_IMAGE.h!,
                          }}
                          position={{
                            x: il.x ?? DEFAULT_IMAGE.x!,
                            y: il.y ?? DEFAULT_IMAGE.y!,
                          }}
                          lockAspectRatio={il.lockAspectRatio}
                          onDragStart={() => setSelectedId(il.id)}
                          onDragStop={(_, d) =>
                            setLayer(il.id, (l) => ({
                              ...(l as ImageLayer),
                              x: Math.round(d.x),
                              y: Math.round(d.y),
                            }))
                          }
                          onResizeStart={() => setSelectedId(il.id)}
                          onResizeStop={(_, __, ref, ___, pos) =>
                            setLayer(il.id, (l) => ({
                              ...(l as ImageLayer),
                              x: Math.round(pos.x),
                              y: Math.round(pos.y),
                              w: Math.round(ref.offsetWidth),
                              h: Math.round(ref.offsetHeight),
                            }))
                          }
                          style={{
                            ...commonStyle,
                            background: "transparent",
                          }}
                          enableUserSelectHack={false}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={il.src || "/placeholder.svg"}
                            alt="Logo layer"
                            className="h-full w-full object-contain pointer-events-none select-none"
                            draggable={false}
                            aria-hidden
                          />
                        </Rnd>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
