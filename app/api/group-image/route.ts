import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("imageUrl");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 500 }
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching image" },
      { status: 500 }
    );
  }
}
