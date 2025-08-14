"use server";

type CheckoutResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  errors?: Record<string, string>;
};

export async function submitCheckout(
  _: CheckoutResult,
  formData: FormData
): Promise<CheckoutResult> {
  // Simulate processing
  await new Promise((r) => setTimeout(r, 1000));

  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const cardNumber = String(formData.get("cardNumber") || "").replace(
    /\s/g,
    ""
  );
  const expiry = String(formData.get("expiry") || "");
  const cvc = String(formData.get("cvc") || "");

  const errors: Record<string, string> = {};

  if (!name) errors.name = "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email.";
  if (!/^\d{13,19}$/.test(cardNumber))
    errors.cardNumber = "Enter a valid card number.";
  if (!/^\d{2}\/\d{2}$/.test(expiry)) errors.expiry = "Expiry must be MM/YY.";
  if (!/^\d{3,4}$/.test(cvc)) errors.cvc = "Enter a valid CVC.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted errors.", errors };
  }

  // Fake success
  const orderId = `ord_${Math.random().toString(36).slice(2, 10)}`;
  return { ok: true, message: "Payment processed successfully.", orderId };
}
