// pages/api/gallery-designs.ts
import { NextResponse } from "next/server";
import { getGalleryDesigns } from "@/lib/apis/gallery_apis";
import { GalleryType } from "@/lib/types";

export async function GET() {
  try {
    const designs: GalleryType = await getGalleryDesigns();
    return NextResponse.json(designs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
