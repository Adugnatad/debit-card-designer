import { sendDesignSnapshot } from "@/hooks/use-confirmInvitationOrder";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const res = await sendDesignSnapshot(payload);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create design snapshot" },
      { status: 400 }
    );
  }
}
