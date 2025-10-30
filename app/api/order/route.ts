import { submitOrder } from "@/lib/apis/order_api";
import type { orderPayload } from "@/lib/apis/order_api";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as orderPayload;

    if (!req || !req.headers) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const sessionToken = req.headers.get("x-session-token");
    if (!sessionToken) {
      return Response.json(
        { message: "Missing session token" },
        { status: 401 }
      );
    }

    await submitOrder(payload);

    return Response.json(
      { message: "Order submitted successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { message: error.message || "Failed to submit order" },
      { status: 400 }
    );
  }
}
