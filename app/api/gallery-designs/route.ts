// pages/api/gallery-designs.ts
import { NextResponse } from "next/server";
import { getGalleryDesigns } from "@/lib/apis/gallery_apis"; // Adjust the path if necessary
import type { CardDesign } from "@/lib/apis/gallery_apis";

export async function GET() {
  try {
    const designs: CardDesign[] = await getGalleryDesigns();
    return NextResponse.json(designs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
