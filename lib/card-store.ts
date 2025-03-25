import type { CardDesign } from "@/components/card-designer";

// Mock database for card designs
const cardDesigns: Record<string, CardDesign> = {
  "sample-1": {
    backgroundImage: null,
    backgroundColor: "#1e40af",
    customText: "John Doe",
    textColor: "#ffffff",
    fontFamily: "Montserrat",
    textPosition: { x: 30, y: 120 },
    cardDetailsTextColor: "#ffffff",
    logoPosition: { x: 0, y: 0 },
    logo: null,
  },
  "sample-2": {
    backgroundImage: null,
    backgroundColor: "#047857",
    customText: "Jane Smith",
    textColor: "#f0f0f0",
    fontFamily: "Arial",
    cardDetailsTextColor: "#e0e0e0",
    logoPosition: { x: 0, y: 0 },
    logo: null,
    textPosition: { x: 40, y: 130 },
  },
  "sample-3": {
    backgroundImage: null,
    backgroundColor: "#7e22ce",
    cardDetailsTextColor: "#f5f5f5",
    fontFamily: "Roboto",
    customText: "Alice Johnson",
    logoPosition: { x: 0, y: 0 },
    logo: null,
    textColor: "#ffffff",
    textPosition: { x: 35, y: 125 },
  },
};

// Default card design
export const defaultCardDesign: CardDesign = {
  backgroundImage: null,
  backgroundColor: "#0f172a",
  customText: "Your Name",
  textColor: "#ffffff",
  fontFamily: "Inter",
  textPosition: { x: 30, y: 120 },
  cardDetailsTextColor: "#ffffff",
  logoPosition: { x: 0, y: 0 },
  logo: null,
};

// Get a card design by ID
export function getCardDesign(id: string): CardDesign | null {
  return cardDesigns[id] || null;
}

// Save a card design
export function saveCardDesign(id: string, design: CardDesign): void {
  cardDesigns[id] = design;
}

// Generate a unique ID for a new card design
export function generateCardId(): string {
  return `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Get all card designs
export function getAllCardDesigns(): { id: string; design: CardDesign }[] {
  return Object.entries(cardDesigns).map(([id, design]) => ({ id, design }));
}
