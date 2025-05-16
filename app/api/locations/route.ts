// app/api/locations/route.ts
import { NextResponse } from "next/server";
import { getLocation } from "@/lib/apis/map_apis"; // Adjust import path as needed
import type { Location } from "@/lib/apis/map_apis"; // Adjust import path as needed

export async function GET() {
  try {
    const locations: Location[] = await getLocation();
    return NextResponse.json(locations);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
