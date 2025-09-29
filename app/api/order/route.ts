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

    // const payload: orderPayload = {
    //   name: formData.get("name") as string,
    //   email: formData.get("email") as string | undefined,
    //   requestType: formData.get("requestType") as string,
    //   accountNumber: formData.get("accountNumber") as string,
    //   pickup_location: formData.get("pickup_location") as string,
    //   image: formData.get("image"), // filled later
    //   list_of_phoneNumbers: [],
    //   user_id: formData.get("user_id") as string,
    //   session_token: sessionToken,
    // };

    // Gather phone numbers
    // for (const [key, value] of formData.entries()) {
    //   if (key.startsWith("list_of_phoneNumbers")) {
    //     payload.list_of_phoneNumbers?.push(value as string);
    //   }
    // }

    await submitOrder(payload);

    return Response.json(
      { message: "Order submitted successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    // console.error("Error submitting order:", error);
    return Response.json(
      { message: error.message || "Failed to submit order" },
      { status: 400 }
    );
  }
}
